locals {
  resource_name = "${var.app_name}-${var.name}"
}

module "network" {
  source = "../network"

  availability_zones = ["us-east-2a", "us-east-2b", "us-east-2c"]
  cidr               = "10.0.0.0/16"
  name               = local.resource_name
  nat_instance_type  = var.nat_instance_type
}

module "cluster" {
  source = "../cluster"

  security_groups     = [module.network.private_security_group]
  subnets             = module.network.private_subnets
  name                = local.resource_name
  vpc_id              = module.network.vpc_id
  min_size            = var.cluster_min_size
  desired_size        = var.cluster_desired_size
  max_size            = var.cluster_max_size
  root_volume_size_gb = var.root_volume_size_gb
  root_volume_type    = var.root_volume_type

  # ✅ Add custom domain configuration
  custom_domain_name  = var.subdomain != "" && var.domain_name != "" ? "${var.subdomain}.${var.domain_name}" : ""
  acm_certificate_arn = var.acm_certificate_arn

  # Customization what instance type we're provisioning and where do you want to put the instances when ready to be scheduled (spot or on-demand)
  capacity_providers = {
    "spot" = {
      instance_type = var.cluster_instance_type
      market_type   = "spot"
    }
  }
}

module "service" {
  source = "../service"

  capacity_provider = "spot"
  cluster_id        = module.cluster.cluster_arn
  cluster_name      = local.resource_name
  image_registry    = "${data.aws_caller_identity.this.account_id}.dkr.ecr.${data.aws_region.this.name}.amazonaws.com"
  image_repository  = "neocloud"
  image_tag         = local.resource_name
  listener_arn      = module.cluster.listener_arn
  name              = "service"
  paths             = ["/*"]
  port              = 8080
  vpc_id            = module.network.vpc_id

  # This is where we add env variables for the service
  config = {
    CORS_ORIGINS           = jsonencode(var.cors_origins)
    BROKKR_BASE_URL        = "https://brokkr.hydrahost.com/api/v1"
    BROKKR_TIMEOUT_SECONDS = "15"
  }

  secrets = [
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
    "GOOGLE_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_DATABASE_URL",
    "ALEMBIC_DB_URL",
    "BROKKR_API_KEY"
  ]
}


# Create Route53 record for this environment's subdomain (only if custom domain is configured)
resource "aws_route53_record" "environment" {
  count = var.route53_zone_id != "" ? 1 : 0

  zone_id = var.route53_zone_id
  name    = "${var.subdomain}.${var.domain_name}"
  type    = "A"

  alias {
    name                   = module.cluster.distribution_domain
    zone_id                = module.cluster.distribution_zone_id
    evaluate_target_health = false
  }
}
