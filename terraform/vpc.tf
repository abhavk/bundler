data "aws_vpc" "main" {
  id = "vpc-7109330b"
}

data "aws_subnet" "public_1" {
  id = "subnet-b0d03ed6"
}

data "aws_subnet" "public_2" {
  id = "subnet-48f84105"
}

data "aws_subnet" "public_3" {
  id = "subnet-8b59b2d4"
}

data "aws_subnet" "public_4" {
  id = "subnet-11665b2f"
}

data "aws_subnet" "public_5" {
  id = "subnet-b62181b8"
}

data "aws_subnet" "public_6" {
  id = "subnet-69ac5848"
}

data "aws_subnet" "private_1" {
  id = "subnet-0dadc33a997bb456d"
}

data "aws_subnet" "private_2" {
  id = "subnet-0981cdbc1b0e582dd"
}

resource "aws_eip" "nat_1" {
  vpc   = true
}

resource "aws_eip" "nat_2" {
  vpc   = true
}

resource "aws_route_table" "private_1" {
  vpc_id = data.aws_vpc.main.id
}

resource "aws_route_table" "private_2" {
  vpc_id = data.aws_vpc.main.id
}

resource "aws_nat_gateway" "nat_gw_1" {
  allocation_id = aws_eip.nat_1.id
  subnet_id     = data.aws_subnet.public_1.id
}

resource "aws_nat_gateway" "nat_gw_2" {
  allocation_id = aws_eip.nat_2.id
  subnet_id     = data.aws_subnet.public_2.id
}

resource "aws_route" "private_1" {
  route_table_id         = aws_route_table.private_1.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat_gw_1.id
}

resource "aws_route" "private_2" {
  route_table_id         = aws_route_table.private_2.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat_gw_2.id
}
