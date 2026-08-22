output "redis_public_ip" {
  value = aws_instance.redis.public_ip
}

output "redis_private_ip" {
  value = aws_instance.redis.private_ip
}

output "api_public_ip" {
  value = aws_instance.api.public_ip
}

output "worker_public_ips" {
  value = aws_instance.worker[*].public_ip
}

resource "local_file" "ansible_inventory" {
  content = templatefile("${path.module}/inventory.tpl", {
    redis_ip         = aws_instance.redis.public_ip,
    redis_private_ip = aws_instance.redis.private_ip,
    api_ip           = aws_instance.api.public_ip,
    worker_ips       = aws_instance.worker[*].public_ip
  })
  filename = "${path.module}/../ansible/inventory.ini"
}
