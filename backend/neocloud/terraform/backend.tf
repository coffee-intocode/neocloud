terraform {
  backend "s3" {
    bucket = "terraform-state-intersection"
    key    = "neocloud/terraform.tfstate"
    region = "us-east-2"
  }
}
