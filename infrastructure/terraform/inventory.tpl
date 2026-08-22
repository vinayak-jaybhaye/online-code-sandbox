[redis]
${redis_ip} ansible_user=ubuntu redis_private_ip=${redis_private_ip}

[api]
${api_ip} ansible_user=ubuntu redis_private_ip=${redis_private_ip}

[workers]
%{ for ip in worker_ips ~}
${ip} ansible_user=ubuntu redis_private_ip=${redis_private_ip}
%{ endfor ~}

[all:vars]
ansible_ssh_common_args='-o StrictHostKeyChecking=no'
ansible_ssh_private_key_file='~/keys/sandbox-key.pem'
