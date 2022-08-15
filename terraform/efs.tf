resource "aws_efs_file_system" "bundler_tmp" {
  tags = {
    Name = "BUNDLER-TMP"
  }
}

resource "aws_efs_mount_target" "bundler_tmp_mount" {
  file_system_id = aws_efs_file_system.bundler_tmp.id
  subnet_id      = data.aws_subnet.public_1.id
}
