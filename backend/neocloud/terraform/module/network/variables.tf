variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "cidr" {
  description = "CIDR block"
  type        = string
}

variable "name" {
  description = "Name of the network"
  type        = string
}

variable "nat_instance_type" {
  description = "Instance type for the NAT instance"
  type        = string
  default     = "t3.nano"
}
