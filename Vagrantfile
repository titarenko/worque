# -*- mode: ruby -*-
# vi: set ft=ruby :

VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
	config.vm.box = "trusty64"
	config.vm.box_url = "https://cloud-images.ubuntu.com/vagrant/trusty/current/trusty-server-cloudimg-amd64-vagrant-disk1.box"
	config.vm.provision "shell", :path => "etc/provision.sh"

	config.vm.network :forwarded_port, host: 3000, guest: 15672

	config.vm.synced_folder ".", "/vagrant"
end
