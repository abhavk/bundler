locals {
  import_data_items_cnt = 0
}

resource "aws_security_group" "lambda_security_group" {
  name        = "Lambda Security Group"
  description = "Lambda Security Group"
  vpc_id      = data.aws_vpc.main.id

  ingress {
    from_port = 2049
    to_port   = 2049
    protocol  = "tcp"
    cidr_blocks = [
      data.aws_subnet.public_1.cidr_block,
      data.aws_subnet.public_2.cidr_block,
      data.aws_subnet.public_3.cidr_block,
      data.aws_subnet.public_4.cidr_block,
      data.aws_subnet.public_5.cidr_block,
      data.aws_subnet.public_6.cidr_block,
    ]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

}


resource "aws_cloudwatch_log_group" "import_data_items" {
  for_each          = toset(flatten([for i in range(1, sum([1, local.import_data_items_cnt])) : tostring(i)]))
  name              = "/aws/lambda/import-data-items-${each.key}"
  retention_in_days = 14
}

resource "aws_lambda_function" "import_data_items" {
  for_each = toset(flatten([for i in range(1, sum([1, local.import_data_items_cnt])) : tostring(i)]))

  depends_on = [
    aws_s3_bucket.lambdas,
    aws_cloudwatch_log_group.import_data_items
  ]

  function_name = "import-data_items-${each.key}"
  handler       = "dist/import-data-items-min.handler"
  role          = aws_iam_role.lambda_job.arn
  runtime       = "nodejs14.x"

  s3_bucket = aws_s3_bucket.lambdas.id
  s3_key    = "import-data-items.zip"

  timeout     = 360
  memory_size = 128

  vpc_config {
    subnet_ids = [
      data.aws_subnet.public_1.id,
      data.aws_subnet.public_2.id,
      data.aws_subnet.public_3.id,
    ]
    security_group_ids = [aws_security_group.lambda_security_group.id]
  }

  environment {
    variables = {
      SQS_IMPORT_DATA_ITEMS_URL = aws_sqs_queue.import_data_items.url
    }
  }

  lifecycle {
    ignore_changes = [last_modified, source_code_hash]
  }
}


resource "aws_lambda_event_source_mapping" "import_data_items" {
  for_each = toset(flatten([for i in range(1, sum([1, local.import_data_items_cnt])) : tostring(i)]))

  event_source_arn                   = aws_sqs_queue.import_data_items.arn
  function_name                      = aws_lambda_function.import_data_items["${each.key}"].arn
  maximum_batching_window_in_seconds = 2
}
