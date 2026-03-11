variable "capacity_providers" {
  default = {}
  type = map(object({
    instance_type = string
    market_type   = string
  }))
}

variable "name" {
  type = string
}

variable "security_groups" {
  type = list(string)
}

variable "subnets" {
  type = list(string)
}

variable "vpc_id" {
  type = string
}

variable "min_size" {
  description = "Minimum size of each autoscaling group"
  type        = number
  default     = 1
}

variable "desired_size" {
  description = "Desired size of each autoscaling group"
  type        = number
  default     = 1
}

variable "max_size" {
  description = "Maximum size of each autoscaling group"
  type        = number
  default     = 5
}

variable "root_volume_size_gb" {
  description = "Root EBS volume size for ECS instances"
  type        = number
  default     = 30
}

variable "root_volume_type" {
  description = "Root EBS volume type for ECS instances"
  type        = string
  default     = "gp3"
}

variable "custom_domain_name" {
  description = "Custom domain name for CloudFront distribution"
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for custom domain"
  type        = string
  default     = ""
}
