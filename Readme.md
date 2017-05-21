# Docker Swarm Faas deploy demo

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You will need Docker, NPM and node.js.

### Installing

This will start you docker in swarm mode.

```
docker swarm init
```

This will create a new Worker Node in your swarm that will receive some instances of your service.
You can deploy more than one worker by changing the name, hostname and the exposed port (->12375:2375)

```
docker run -d --privileged --name worker-1 --hostname=worker-1 -p 12375:2375 docker:dind
docker --host=localhost:12375 swarm join --token $(docker swarm join-token -q worker) $(docker info | grep -w 'Node Address' | awk '{print $3}'):2377
```
Now on the root of this project.
You need to create an overlay network so all your service can see each other.

```
make create-overlay
```

This creates a image with NGINX with the services that will be expose from the overlay network.

```
make create-router
```

For the sake of this example, I already created a public Image for this service. I did this because the workers cannot see the images that you have registered in your local machine Docker (the master in the Swarm). To deploy the service just run:
[Click here to now more about Image Registry](RegistringImages.md)

```
make start-swarm
```

Now we can start the router. If you start the router before the services NGINX will not be able to resolve the hosts and will stop it's startup.

```
make start-router
```

Let's also start the Docker Swarm Visualizer so we can see if the services are being distributed correctly.

http://localhost:8080 to access it.

```
make start-visualizer
```

Now we only need to start the auto scaling by running:

```
node docker/index.js
```
If the a new worker is added, the auto scaling needs to be restarted.

## Running the tests

To run the tests, just call

```
make run-stress-test
```
