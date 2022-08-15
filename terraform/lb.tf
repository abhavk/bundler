data "aws_acm_certificate" "arweave_net_certificate" {
  domain      = "arweave.net"
  types       = ["AMAZON_ISSUED"]
  most_recent = true
}

resource "aws_security_group" "bundler_security_group" {
  name   = "bundler-loadbalancer"
  vpc_id = data.aws_vpc.main.id

  ingress {
    description = "Unencrypted HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Encrypted HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_lb" "bundler_alb" {
  name               = "bundler-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.bundler_security_group.id]
  subnets = [
    data.aws_subnet.public_1.id,
    data.aws_subnet.public_2.id,
    data.aws_subnet.public_3.id,
  ]

  depends_on = [aws_security_group.bundler_security_group]
}

resource "aws_lb_target_group" "bundler_tg" {
  name        = "bundler-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled = true
    path    = "/health"
    timeout = 3
  }

  depends_on = [aws_lb.bundler_alb]
}

resource "aws_lb_listener" "bundler_listener_http" {
  load_balancer_arn = aws_lb.bundler_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.bundler_tg.arn
  }
}


resource "aws_lb_listener" "bundler_listener_https" {
  load_balancer_arn = aws_lb.bundler_alb.arn
  port              = "443"
  protocol          = "HTTPS"
  certificate_arn   = data.aws_acm_certificate.arweave_net_certificate.arn


  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.bundler_tg.arn
  }
}
