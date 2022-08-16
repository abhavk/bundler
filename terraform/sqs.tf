resource "aws_sqs_queue" "import_data_items_dlq" {
  name                      = "import-data-items-dlq"
  message_retention_seconds = 1209600 #14 days in seconds, max supported value
}

resource "aws_sqs_queue" "import_data_items" {
  name                      = "import-data-items"
  delay_seconds             = 0
  message_retention_seconds = 1209600 #14 days in seconds, max supported value
  receive_wait_time_seconds = 5
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.import_data_items_dlq.arn
    maxReceiveCount     = 4
  })
  visibility_timeout_seconds = 720
}

resource "aws_sqs_queue" "export_bundles_dlq" {
  name                      = "export-bundles-dlq"
  message_retention_seconds = 1209600 #14 days in seconds, max supported value
}

resource "aws_sqs_queue" "export_bundles" {
  name                      = "export-bundles"
  delay_seconds             = 0
  message_retention_seconds = 1209600 #14 days in seconds, max supported value
  receive_wait_time_seconds = 5
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.export_bundles_dlq.arn
    maxReceiveCount     = 4
  })
  visibility_timeout_seconds = 720
}
