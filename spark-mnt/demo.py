from pyspark.context import SparkContext
from pyspark.sql import SparkSession

sc = SparkContext('local[*]')
spark = SparkSession(sc)
spark.conf.set("spark.sql.shuffle.partitions", "1")

db_name = "demo_etl"

spark.sql(f"CREATE DATABASE IF NOT EXISTS {db_name}")
spark.catalog.setCurrentDatabase(db_name)

tables = ["customers", "orders", "products", "sales"]
for table in tables:
    spark.read \
        .option("header", "true") \
        .option("inferSchema", "true") \
        .csv(f"wasbs://public@rakirahman.blob.core.windows.net/datasets/{table}.csv") \
        .write \
        .format("delta") \
        .mode("append") \
        .saveAsTable(f"{db_name}.{table}")

transformations = [
    (
        "customers_cleaned",
        f"""
            SELECT
                c.customerID,
                c.customerName,
                c.contact,
                CASE 
                    WHEN COUNT(o.orderID) OVER (PARTITION BY c.customerID) > 0 THEN TRUE 
                    ELSE FALSE 
                END AS has_orders
            FROM {db_name}.customers c 
            LEFT JOIN {db_name}.orders o ON c.customerID = o.customerID
        """
    ),
    (
        "products_enriched",
        f"""
            SELECT
                productID,
                productName,
                price,
                CASE 
                    WHEN price > 0 THEN TRUE 
                    ELSE FALSE 
                END AS is_in_stock
            FROM {db_name}.products
        """
    ),
    (
        "sales_enriched",
        f"""
            SELECT
                o.customerID,
                s.orderID,
                s.productID,
                p.productName,
                s.quantity,
                p.price * s.quantity as total_amount   
            FROM {db_name}.sales s 
            JOIN {db_name}.orders o ON s.orderID = o.orderID
            JOIN {db_name}.products p ON s.productID = p.productID
            WHERE quantity > 0
        """
    ),
    (
        "customer_lifetime_value",
        f"""
            SELECT
                s.customerID,
                SUM(s.total_amount) AS total_spent,
                COUNT(s.orderID) AS total_orders
            FROM {db_name}.sales_enriched s 
            GROUP BY customerID
        """
    ),
    (
        "product_sales_performance",
        f"""
            SELECT
                s.productID,
                SUM(s.quantity) AS total_units_sold,
                SUM(s.total_amount) AS total_revenue
            FROM {db_name}.sales_enriched s
            JOIN {db_name}.products_enriched p ON s.productID = p.productID
            GROUP BY s.productID
        """
    )
]

for table, sql_query in transformations:
    print(f"Creating table: {table}")
    spark.sql(sql_query) \
        .write \
        .format("delta") \
        .mode("overwrite") \
        .saveAsTable(f"{db_name}.{table}")
