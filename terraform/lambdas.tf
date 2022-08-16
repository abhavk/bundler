locals {
  import_data_items_cnt = 1
  environment_variables = {
    SQS_IMPORT_DATA_ITEMS_URL = aws_sqs_queue.import_data_items.url
    SQS_EXPORT_BUNDLES_URL    = aws_sqs_queue.export_bundles.url
    BUNDLER_GATEWAY_BUCKET    = module.s3-bundler-gateway-bucket.s3_bucket_id
  }
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
      data.aws_subnet.private_1.cidr_block,
      data.aws_subnet.private_2.cidr_block,
    ]
  }

  ingress {
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  ingress {
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
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

  function_name = "import-data-items-${each.key}"
  handler       = "dist/index.handler"
  role          = aws_iam_role.lambda_job.arn
  runtime       = "nodejs16.x"

  s3_bucket = aws_s3_bucket.lambdas.id
  s3_key    = "import-data-items.zip"

  timeout     = 360
  memory_size = 128

  vpc_config {
    subnet_ids = [
      data.aws_subnet.private_1.id,
      data.aws_subnet.private_2.id,
    ]
    security_group_ids = [aws_security_group.lambda_security_group.id]
  }

  environment {
    variables = local.environment_variables
  }

  lifecycle {
    ignore_changes = [last_modified, source_code_hash]
  }

  file_system_config {
    arn              = aws_efs_access_point.lambda_access_point.arn
    local_mount_path = "/mnt/data-items"
  }
}


resource "aws_lambda_event_source_mapping" "import_data_items" {
  for_each = toset(flatten([for i in range(1, sum([1, local.import_data_items_cnt])) : tostring(i)]))

  event_source_arn                   = aws_sqs_queue.import_data_items.arn
  function_name                      = aws_lambda_function.import_data_items["${each.key}"].arn
  maximum_batching_window_in_seconds = 2
}

resource "aws_cloudwatch_log_group" "collect_data_items" {
  name              = "/aws/lambda/collect-data-items"
  retention_in_days = 14
}

resource "aws_lambda_function" "collect_data_items" {
  depends_on = [
    aws_s3_bucket.lambdas,
    aws_cloudwatch_log_group.collect_data_items
  ]

  function_name = "collect-data-items"
  handler       = "dist/index.handler"
  role          = aws_iam_role.lambda_job.arn
  runtime       = "nodejs16.x"

  s3_bucket = aws_s3_bucket.lambdas.id
  s3_key    = "collect-data-items.zip"

  timeout     = 360
  memory_size = 128

  vpc_config {
    subnet_ids = [
      data.aws_subnet.private_1.id,
      data.aws_subnet.private_2.id,
    ]
    security_group_ids = [aws_security_group.lambda_security_group.id]
  }

  environment {
    variables = local.environment_variables
  }

  lifecycle {
    ignore_changes = [last_modified, source_code_hash]
  }

  file_system_config {
    arn              = aws_efs_access_point.lambda_access_point.arn
    local_mount_path = "/mnt/data-items"
  }
}

resource "aws_lambda_permission" "collect_data_items" {
  statement_id  = "AllowShepardSyncLambdaExecutionFromEventBrigde"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.collect_data_items.function_name
  principal     = "events.amazonaws.com"
  source_arn    = module.data_items_collector_cron_job.eventbridge_rule_arns["crons"]
}
