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
