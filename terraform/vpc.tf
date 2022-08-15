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
