resource "aws_efs_file_system" "bundler_tmp" {
  tags = {
    Name = "BUNDLER-TMP"
  }
}

resource "aws_efs_mount_target" "bundler_tmp_mount_1" {
  file_system_id = aws_efs_file_system.bundler_tmp.id
  subnet_id      = data.aws_subnet.public_1.id
}

resource "aws_efs_mount_target" "bundler_tmp_mount_2" {
  file_system_id = aws_efs_file_system.bundler_tmp.id
  subnet_id      = data.aws_subnet.public_2.id
}

resource "aws_efs_mount_target" "bundler_tmp_mount_3" {
  file_system_id = aws_efs_file_system.bundler_tmp.id
  subnet_id      = data.aws_subnet.public_3.id
}
