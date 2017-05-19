create-overlay:
	docker network create --driver overlay demo-network

create-server:
	docker build -f ./docker/dockerfile.server -t demo-deploy .

start-swarm:
	docker service create --replicas 1 --network demo-network --name authentication-service pedrosap/demo
	docker service create --replicas 1 --network demo-network --name fibonacci-service pedrosap/demo

stop-swarm:
	docker service rm authentication-service
	docker service rm fibonacci-service

create-router:
	docker build -f ./docker/dockerfile.nginx -t demo-deploy/nginx .

start-router:
	docker service create --replicas 1 --name router --network demo-network --publish 80:80 demo-deploy/nginx

stop-router:
	docker service rm router

run-stress-test:
	ab -k -c 10 -n 500 0.0.0.0/fibonacci?token=asdfas

start-worker:
	# for some reason the variables aren't being set
	set SWARM_TOKEN=$(docker swarm join-token -q worker)
	set SWARM_MASTER=$(docker info | grep -w 'Node Address' | awk '{print $3}')
	docker run -d --privileged --name worker-1 --hostname=worker-1 -p 12375:2375 docker:dind
	docker --host=localhost:12375 swarm join --token $(docker swarm join-token -q worker) $(docker info | grep -w 'Node Address' | awk '{print $3}'):2377

remove-worker:
	docker stop worker-1
	docker rm worker-1

start-visualizer:
	docker run -it -d -p 8080:8080 -v /var/run/docker.sock:/var/run/docker.sock dockersamples/visualizer