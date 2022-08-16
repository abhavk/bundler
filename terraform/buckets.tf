resource "aws_s3_bucket" "lambdas" {
  bucket = "arweave-lambda-deployments"
}

module "s3-bundler-gateway-bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "3.3.0"
  bucket  = "bundler-gateway-bucket"
  acl     = "private"

  versioning = {
    enabled = false
  }

  force_destroy = false
  putin_khuylo  = true
}

data "aws_iam_policy_document" "bundler_bucket_policy_document" {
  statement {
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${module.s3-bundler-gateway-bucket.s3_bucket_arn}/*"]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.origin_access_identity.iam_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "bundler_bucket_policy" {
  bucket = module.s3-bundler-gateway-bucket.s3_bucket_id
  policy = data.aws_iam_policy_document.bundler_bucket_policy_document.json
}
