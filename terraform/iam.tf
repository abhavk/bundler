resource "aws_iam_role" "arweave_fargate" {
  name = "arweave-fargate-role"
  path = "/serviceaccounts/"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Service = [
            "ecs.amazonaws.com",
            "ecs-tasks.amazonaws.com",
            "ec2.amazonaws.com"
          ]
        }
      },
    ]
  })
}

resource "aws_iam_role_policy" "arweave_fargate_policy" {
  name = "arweave-fargate-policy"
  role = aws_iam_role.arweave_fargate.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role" "bundler_task_role" {
  name = "BundlerTaskRole"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": [
          "ecs.amazonaws.com",
          "ecs-tasks.amazonaws.com",
          "ec2.amazonaws.com"
        ]
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF

  inline_policy {
    name = "bundler_inline_policy"

    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Action = [
            "sts:GetCallerIdentity"
          ]
          Effect   = "Allow"
          Resource = "*"
        },
      ]
    })
  }
}
