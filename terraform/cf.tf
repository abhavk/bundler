# module "cdn" {
#   source = "cloudposse/cloudfront-s3-cdn/aws"

#   # Cloud Posse recommends pinning every module to a specific version
#   version = "0.82.4"

#   aliases           = ["m-mainnet-cache.arweave.net"]
#   dns_alias_enabled = true
#   parent_zone_name  = "arweave.net"
#   s3_origins = {
#     domain_name = module.s3-bundler-gateway-bucket.bucket_regional_domain_name
#     origin_id   = module.s3-bundler-gateway-bucket.bucket_id
#     origin_path = null
#     s3_origin_config = {
#       origin_access_identity = null # will get translated to the origin_access_identity used by the origin created by this module.
#     }
#   }
#   origin_groups = {
#     primary_origin_id  = null # will get translated to the origin id of the origin created by this module.
#     failover_origin_id = module.s3-bundler-gateway-bucket.bucket_id
#     failover_criteria  = [
#       403,
#       404,
#       500,
#       502
#     ]
#   }
# }
