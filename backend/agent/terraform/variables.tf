variable "staging_cors_origins" {
  description = "CORS origins for staging environment"
  type        = list(string)
  default = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://shawn-exp-frontend-config.d1helczvbtzd13.amplifyapp.com",
    "https://stage.intersectionlabs.net",
    "https://main.d1f4evjn6knc79.amplifyapp.com"
  ]
}

variable "staging_nat_instance_type" {
  description = "Instance type for the staging NAT instance"
  type        = string
  default     = "t3.nano"
}

variable "staging_cluster_instance_type" {
  description = "Instance type for staging ECS cluster instances"
  type        = string
  default     = "t3a.small"
}

variable "staging_cluster_min_size" {
  description = "Minimum number of staging ECS cluster instances"
  type        = number
  default     = 1
}

variable "staging_cluster_desired_size" {
  description = "Desired number of staging ECS cluster instances"
  type        = number
  default     = 1
}

variable "staging_cluster_max_size" {
  description = "Maximum number of staging ECS cluster instances"
  type        = number
  default     = 5
}

variable "staging_root_volume_size_gb" {
  description = "Root volume size in GB for staging ECS cluster instances"
  type        = number
  default     = 30
}

variable "staging_root_volume_type" {
  description = "Root volume type for staging ECS cluster instances"
  type        = string
  default     = "gp3"
}
