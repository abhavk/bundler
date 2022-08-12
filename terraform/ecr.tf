locals {
  default_ecr_actions = [
    "ecr:BatchCheckLayerAvailability",
    "ecr:BatchGetImage",
    "ecr:CompleteLayerUpload",
    "ecr:GetDownloadUrlForLayer",
    "ecr:GetLifecyclePolicy",
    "ecr:InitiateLayerUpload",
    "ecr:PutImage",
    "ecr:UploadLayerPart"
  ]
}

resource "aws_ecr_repository" "bundler_ecr" {
  name                 = "bundler-ecr"
  image_tag_mutability = "MUTABLE"
}

resource "aws_ecr_repository_policy" "bundler_ecr_policy" {
  repository = aws_ecr_repository.bundler_ecr.name
  policy = jsonencode({
    Version = "2008-10-17",
    Statement = [
      {
        Sid    = ""
        Effect = "Allow"
        Principal = {
          AWS = [
            "arn:aws:iam::826136779190:root"
          ]
        }
        Action = local.default_ecr_actions
      }
    ]
  })
}
