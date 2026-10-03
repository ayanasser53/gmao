output "ip_publique" {
  value = azurerm_public_ip.gmao.ip_address
}

output "connexion_ssh" {
  value = "ssh -i ~/.ssh/gmao_azure azureuser@${azurerm_public_ip.gmao.ip_address}"
}