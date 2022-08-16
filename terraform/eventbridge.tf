module "data_items_collector_cron_job" {

  source = "terraform-aws-modules/eventbridge/aws"

  create_bus = false
  role_name  = "collect-data-items-cron"

  rules = {
    crons = {
      description         = "Trigger for a Lambda"
      schedule_expression = "rate(5 minutes)"
    }
  }

  targets = {
    crons = [
      {
        name = "collect-data-items-cron"
        arn  = aws_lambda_function.collect_data_items.arn
      }
    ]
  }
}
