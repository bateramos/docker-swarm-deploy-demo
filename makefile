create-overlay:
	docker network create --driver overlay demo-network

create-server:
	docker build -f ./docker/dockerfile.server -t demo-deploy .

start-swarm:
	docker service create --replicas 1 --network demo-network --name authentication-service demo-deploy
	docker service create --replicas 1 --network demo-network --name fibonacci-service demo-deploy

stop-swarm:
	docker service rm authentication-service
	docker service rm fibonacci-service

create-router:
	docker build -f ./docker/dockerfile.nginx -t demo-deploy/nginx .

start-router:
	docker service create --replicas 1 --name router --network demo-network --publish 80:80 demo-deploy/nginx

stop-router:
	docker service rm router
