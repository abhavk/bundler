locals {
  awslogs-multiline-pattern = "^info:|^error:|^verbose:|^debug:|^warn:|^warning:"
}

resource "aws_security_group" "bundler_ecs_security_group" {
  name        = "ECS bundler Security Group"
  description = "ECS bundler Security Group"
  vpc_id      = data.aws_vpc.main.id

  ingress {
    from_port = 3000
    to_port   = 3000
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

  # EFS
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


resource "aws_ecs_cluster" "bundler_cluster" {
  name               = "bundler-cluster"
  capacity_providers = ["FARGATE"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = "100"
  }

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_cloudwatch_log_group" "bundler_cluster" {
  name = "/ecs/bundler-cluster"
}

resource "aws_ecs_task_definition" "bundler_task" {
  family = "bundler"

  requires_compatibilities = [
    "FARGATE",
  ]

  execution_role_arn = aws_iam_role.arweave_fargate.arn
  task_role_arn      = aws_iam_role.bundler_task_role.arn
  network_mode       = "awsvpc"
  cpu                = 512
  memory             = 1024

  container_definitions = jsonencode([
    {
      name  = "bundler-task-definition"
      image = "${aws_ecr_repository.bundler_ecr.repository_url}:latest"
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
        }
      ]

      environment = [
        {
          name  = "SQS_IMPORT_DATA_ITEMS_URL",
          value = aws_sqs_queue.import_data_items.url
        }
      ]

      logConfiguration = {
        logDriver = "awslogs",
        options = {
          awslogs-group             = aws_cloudwatch_log_group.bundler_cluster.name,
          awslogs-region            = var.region,
          awslogs-stream-prefix     = "ecs",
          awslogs-multiline-pattern = local.awslogs-multiline-pattern
        }
      },

      mountPoints = [
        {
          containerPath = "/data-items",
          sourceVolume  = "data-items"
        }
      ],
    }
  ])

  volume {
    name = "data-items"
    efs_volume_configuration {
      file_system_id = aws_efs_file_system.bundler_tmp.id
      root_directory = "/"
    }
  }
}

resource "aws_ecs_service" "bundler_service" {
  name             = "bundler-service"
  cluster          = aws_ecs_cluster.bundler_cluster.id
  task_definition  = aws_ecs_task_definition.bundler_task.arn
  platform_version = "1.4.0" //not specfying this version explictly will not currently work for mounting EFS to Fargate

  desired_count = 1

  load_balancer {
    target_group_arn = aws_lb_target_group.bundler_tg.arn
    container_name   = "bundler-task-definition"
    container_port   = 3000
  }

  network_configuration {
    security_groups = [aws_security_group.bundler_ecs_security_group.id]
    subnets = [
      data.aws_subnet.public_1.id,
      data.aws_subnet.public_2.id,
      data.aws_subnet.public_3.id,
    ]
    assign_public_ip = true
  }

  deployment_controller {
    type = "ECS"
  }

  capacity_provider_strategy {
    base              = 0
    capacity_provider = "FARGATE"
    weight            = 100
  }

}
