import org.apache.spark.sql.Row
import org.apache.spark.sql.types._

spark.sql("CREATE DATABASE IF NOT EXISTS sf")
val schema = StructType(Array(
  StructField("vendor_id", LongType, true),
  StructField("trip_id", LongType, true),
  StructField("trip_distance", FloatType, true),
  StructField("fare_amount", DoubleType, true),
  StructField("store_and_fwd_flag", StringType, true)
))
spark.createDataFrame(spark.sparkContext.emptyRDD[Row], schema).writeTo("sf.waymo").createOrReplace()
val data = Seq(
  Row(1L, 1000371L, 1.8f, 15.32, "N"),
  Row(2L, 1000372L, 2.5f, 22.15, "N"),
  Row(2L, 1000373L, 0.9f, 9.01, "N"),
  Row(1L, 1000374L, 8.4f, 42.13, "Y")
)
spark.createDataFrame(spark.sparkContext.parallelize(data), spark.table("sf.waymo").schema).writeTo("sf.waymo").append()
spark.table("sf.waymo").show()
System.exit(0)