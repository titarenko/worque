sudo apt-get update -qq

sudo apt-get install -y -qq nodejs npm rabbitmq-server
sudo ln -s /usr/bin/nodejs /usr/bin/node

sudo rabbitmq-plugins enable rabbitmq_management
sudo service rabbitmq-server restart

echo "cd /vagrant" >> /home/vagrant/.bashrc
