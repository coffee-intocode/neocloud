variable "name" {
  description = "Name of the cloud environment"
  type        = string
}

variable "subdomain" {
  description = "Subdomain for this environment (e.g., 'dev', 'stage', 'app')"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Base domain name"
  type        = string
  default     = ""
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID"
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for CloudFront"
  type        = string
  default     = ""
}

variable "cors_origins" {
  description = "CORS origins"
  type        = list(string)
  default     = ["http://localhost:3000", "http://localhost:5173"]
}

variable "nat_instance_type" {
  description = "Instance type for the environment NAT instance"
  type        = string
  default     = "t3.nano"
}

variable "cluster_instance_type" {
  description = "Instance type for ECS EC2 cluster instances"
  type        = string
  default     = "t3a.small"
}

variable "cluster_min_size" {
  description = "Minimum number of ECS EC2 instances"
  type        = number
  default     = 1
}

variable "cluster_desired_size" {
  description = "Desired number of ECS EC2 instances"
  type        = number
  default     = 1
}

variable "cluster_max_size" {
  description = "Maximum number of ECS EC2 instances"
  type        = number
  default     = 5
}

variable "root_volume_size_gb" {
  description = "Root EBS volume size for ECS EC2 instances"
  type        = number
  default     = 30
}

variable "root_volume_type" {
  description = "Root EBS volume type for ECS EC2 instances"
  type        = string
  default     = "gp3"
}
