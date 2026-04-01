data "aws_ssm_parameter" "nat_instance_ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64"
}

resource "aws_security_group" "nat_instance" {
  description = "Security group for the NAT instance"
  name_prefix = "${var.name}-nat-"
  vpc_id      = module.vpc.vpc_id
}

resource "aws_vpc_security_group_ingress_rule" "nat_from_vpc" {
  security_group_id = aws_security_group.nat_instance.id

  cidr_ipv4   = var.cidr
  ip_protocol = "-1"
}

resource "aws_vpc_security_group_egress_rule" "nat_to_internet" {
  security_group_id = aws_security_group.nat_instance.id

  cidr_ipv4   = "0.0.0.0/0"
  ip_protocol = "-1"
}

resource "aws_instance" "nat" {
  ami                         = data.aws_ssm_parameter.nat_instance_ami.value
  associate_public_ip_address = true
  instance_type               = var.nat_instance_type
  source_dest_check           = false
  subnet_id                   = module.vpc.public_subnets[0]
  vpc_security_group_ids      = [aws_security_group.nat_instance.id]

  user_data = <<-EOT
    #!/bin/bash
    set -euxo pipefail

    yum install -y iptables-services
    systemctl enable iptables
    systemctl start iptables

    sysctl -w net.ipv4.ip_forward=1
    echo "net.ipv4.ip_forward = 1" > /etc/sysctl.d/99-nat.conf
    sysctl -p /etc/sysctl.d/99-nat.conf

    primary_interface="$(ip route show default | awk '/default/ {print $5; exit}')"

    iptables -t nat -A POSTROUTING -o "$primary_interface" -j MASQUERADE
    iptables -F FORWARD
    service iptables save
  EOT

  tags = {
    Name = "${var.name}-nat"
  }
}

resource "aws_route" "private_nat_instance" {
  count = length(module.vpc.private_route_table_ids)

  destination_cidr_block = "0.0.0.0/0"
  network_interface_id   = aws_instance.nat.primary_network_interface_id
  route_table_id         = module.vpc.private_route_table_ids[count.index]
}
