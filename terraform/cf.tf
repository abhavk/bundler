resource "aws_cloudfront_origin_access_identity" "origin_access_identity" {}


resource "aws_cloudfront_distribution" "bundler_s3_distribution" {
  origin {
    domain_name = module.s3-bundler-gateway-bucket.s3_bucket_bucket_regional_domain_name
    origin_id   = module.s3-bundler-gateway-bucket.s3_bucket_id

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.origin_access_identity.cloudfront_access_identity_path
    }
  }

  enabled         = true
  is_ipv6_enabled = true
  comment         = "bundler-cdn"
  # default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = module.s3-bundler-gateway-bucket.s3_bucket_id

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "allow-all"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  price_class = "PriceClass_200"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Environment = "production"
    Name        = "bundler-cdn"
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
