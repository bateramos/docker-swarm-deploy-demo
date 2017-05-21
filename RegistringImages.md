# Image Registry

We have some options on how to make a image available to your Nodes in Docker Swarm.

The first of them is to push this image to Docker Hub. You just need to remember that if the image is private you need to log with your account in the Docker Swarm master (the docker in your machine in the case of this demo) and pass --with-registry-auth option. If the image is public this step is not necessary.

The other option is to use a service called Registry. This is a Image maintained by Docker that allow you to registry your images on it and your Swarm Nodes will try to resolve the image first at the Registry running on your docker.

https://hub.docker.com/_/registry/
https://docs.docker.com/registry/deploying/