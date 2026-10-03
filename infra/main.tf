# Le dossier qui regroupe tout le projet GMAO
resource "azurerm_resource_group" "gmao" {
  name     = "rg-gmao"
  location = "swedencentral"
}

# Le réseau privé (équivalent du VPC)
resource "azurerm_virtual_network" "gmao" {
  name                = "vnet-gmao"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.gmao.location
  resource_group_name = azurerm_resource_group.gmao.name
}

# Le sous-réseau
resource "azurerm_subnet" "public" {
  name                 = "subnet-public"
  resource_group_name  = azurerm_resource_group.gmao.name
  virtual_network_name = azurerm_virtual_network.gmao.name
  address_prefixes     = ["10.0.1.0/24"]
}

# Le pare-feu (équivalent du security group)
resource "azurerm_network_security_group" "gmao" {
  name                = "nsg-gmao"
  location            = azurerm_resource_group.gmao.location
  resource_group_name = azurerm_resource_group.gmao.name

  security_rule {
    name                       = "SSH"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "HTTP"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

# L'adresse IP publique du serveur
resource "azurerm_public_ip" "gmao" {
  name                = "ip-gmao"
  location            = azurerm_resource_group.gmao.location
  resource_group_name = azurerm_resource_group.gmao.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

# La carte réseau du serveur, branchée au subnet et à l'IP publique
resource "azurerm_network_interface" "gmao" {
  name                = "nic-gmao"
  location            = azurerm_resource_group.gmao.location
  resource_group_name = azurerm_resource_group.gmao.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.public.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.gmao.id
  }
}

# On applique le pare-feu à la carte réseau
resource "azurerm_network_interface_security_group_association" "gmao" {
  network_interface_id      = azurerm_network_interface.gmao.id
  network_security_group_id = azurerm_network_security_group.gmao.id
}

# La machine virtuelle (équivalent de l'EC2)
resource "azurerm_linux_virtual_machine" "gmao" {
  name                  = "vm-gmao"
  location              = azurerm_resource_group.gmao.location
  resource_group_name   = azurerm_resource_group.gmao.name
       size                  = "Standard_B2ats_v2"
  admin_username        = "azureuser"
  network_interface_ids = [azurerm_network_interface.gmao.id]

  admin_ssh_key {
    username   = "azureuser"
    public_key = file(pathexpand("~/.ssh/gmao_azure.pub"))
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "ubuntu-24_04-lts"
    sku       = "server"
    version   = "latest"
  }

  # Script exécuté au premier démarrage : installe Docker
  custom_data = base64encode(file("${path.module}/cloud-init.yaml"))
}