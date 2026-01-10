from pyspark.context import SparkContext
from pyspark.sql import SparkSession

sc = SparkContext('local')
spark = SparkSession(sc)

db_name = "demo_etl"

spark.sql(f"CREATE DATABASE IF NOT EXISTS {db_name}")
spark.catalog.setCurrentDatabase(db_name)

tables = ["customers", "orders", "products", "sales"]
for table in tables:
    spark.read \
        .option("header", "true") \
        .option("inferSchema", "true") \
        .csv(f"wasbs://public@rakirahman.blob.core.windows.net/datasets/{table}.csv") \
        .writeTo(f"{db_name}.{table}") \
        .using("iceberg") \
        .createOrReplace()

spark.sql(f"""
    SELECT
        c.customerID,
        c.customerName,
        c.contact,
        COUNT(o.orderID) as order_count,
        CASE
            WHEN COUNT(o.orderID) > 0 THEN TRUE
            ELSE FALSE
        END AS has_orders
    FROM {db_name}.customers c
    LEFT JOIN {db_name}.orders o ON c.customerID = o.customerID
    GROUP BY c.customerID, c.customerName, c.contact
    ORDER BY order_count DESC
""") \
    .writeTo(f"{db_name}.customers_cleaned") \
    .using("iceberg") \
    .createOrReplace()

spark.sql(f"""
    SELECT
        p.productName,
        COUNT(s.OrderID) as total_sales,
        SUM(s.Quantity) as total_quantity,
        ROUND(AVG(s.Quantity), 2) as avg_quantity_per_sale
    FROM {db_name}.products p
    LEFT JOIN {db_name}.sales s ON p.productID = s.productID
    GROUP BY p.productName
    ORDER BY total_sales DESC
""") \
    .writeTo(f"{db_name}.product_sales_summary") \
    .using("iceberg") \
    .createOrReplace()
