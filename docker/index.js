const map = require('async/map');
const exec = require('child_process').exec;

let services = [];

reloadServiceInfo(() => {
  handleServicesInstances();
  handleStats();
});

function reloadServiceInfo(callback = () => {}) {
  exec('curl --unix-socket /var/run/docker.sock -X GET http:/v1.24/services', (error, data, info) => {
    services = JSON.parse(data).map(s => ({
      id : s.ID, name : s.Spec.Name,
      replicas : s.Spec.Mode.Replicated.Replicas,
    }));
    callback();
  });
}

function handleServicesInstances() {
  map(['docker exec -i worker-1 curl --unix-socket /var/run/docker.sock -X GET http:/v1.24/containers/json',
    'curl --unix-socket /var/run/docker.sock -X GET http:/v1.24/containers/json'],
    (command, cb) => {
      exec(command, (error, data, info) => {
        cb(error, JSON.parse(data));
      })
    },
    (error, data) => {
      data = data.reduce((acc, item) => [...acc, ...item], []);
      const serviceGroup = data.map(s => ({
        id : s.Id, service : s.Labels['com.docker.swarm.service.name'],
      })).reduce((acc, item) => {
        if (!acc[item.service])
          acc[item.service] = [];
        acc[item.service].push(item);
        return acc;
      }, {});

      services.forEach(s => {
        s.instances = serviceGroup[s.name];
      });

      setTimeout(handleServicesInstances, 1000);
    }
  );
}

function scaleDownService(service, callback = () => {}) {
  exec(`docker service scale ${service.name}=${service.instances.length - 1}`, (error, data, info) => {
    console.log(`SCALE DOWN ${service.name}`);
    service.lastPreScaleCount = service.instances.length;
    callback();
  });
}

function scaleUpService(service, callback = () => {}) {
  exec(`docker service scale ${service.name}=${service.instances.length + 1}`, (error, data, info) => {
    console.log(`SCALE UP ${service.name}`);
    service.lastPreScaleCount = service.instances.length;
    callback();
  });
}

function handleStats() {
  map(['docker stats --no-stream', 'docker exec -i worker-1 docker stats --no-stream'],
    (command, cb) => {
      exec(command, (error, data, info) => {
        const serviceInfo = data.split('\n')
          .filter((l, i) => i > 0)
          .map(l => l.split(/(\s+)/))
          .filter(data => data.length > 1)
          .map(data => ({
            container : data[0],
            cpu : parseFloat(data[2].replace('%')),
            memory : parseFloat(data[10].replace('%')),
          }));
        cb(error, serviceInfo);
      });
    },
    (error, serviceInfo) => {
      serviceInfo = serviceInfo.reduce((acc, item) => [...acc, ...item], []);
      services
        .filter(s => s.instances)
        .forEach(s => {
          s.instances.forEach(instance => {
            const info = serviceInfo.find(info => instance.id.startsWith(info.container));
            instance.info = info;
          })
        });

      const toRemove = services
        .filter(s => s.instances)
        .filter(s => !s.lastPreScaleCount || s.lastPreScaleCount != s.instances.length)
        .filter(s => s.instances && s.instances.length > 1)
        .filter(s => s.instances.filter(i => i.info && i.info.cpu == 0).length > 1)
        .reduce((acc, s) => {
          return s.instances.map(i => ({instance : i, service : s}));
        }, [])
        .find(i => i.instance.info && i.instance.info.cpu == 0);

      const serviceToScale = services
        .filter(s => s.instances)
        .filter(s => !s.lastPreScaleCount || s.lastPreScaleCount != s.instances.length)
        .filter(s => s.instances.filter(i => i.info && i.info.cpu < 20).length === 0)
        .reduce((acc, s) => {
          return acc.concat(s.instances.map(i => ({instance : i, service : s})));
        }, [])
        .find(i => i.instance.info && i.instance.info.cpu > 50);

      if (serviceToScale) {
        scaleUpService(serviceToScale.service);
      }

      if (toRemove) {
        scaleDownService(toRemove.service);
      }

      setTimeout(handleStats, 1000);
    });
}