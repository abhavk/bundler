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


resource "aws_efs_access_point" "lambda_access_point" {
  file_system_id = aws_efs_file_system.bundler_tmp.id

  root_directory {
    path = "/"

    creation_info {
      owner_gid   = 1001
      owner_uid   = 1001
      permissions = "755"
    }
  }

  posix_user {
    uid = 1001
    gid = 1001
  }

  tags = {
    Name = "EFS-Lambda-AccessPoint"
  }

}
