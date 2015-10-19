# symux-to-couch

Node daemon to stream symux metrics to couchdb.

```
npm i symux-to-couch
```

Edit as needed for symux and couch servers.

See: http://wpd.home.xs4all.nl/symon/ 


Possible idea to reduce moving parts - pretend to be symux and accept symon clients sending packets directly to this daemon and not have to configure symux for new hosts/metrics - need to deal with binary packet format as opposed to simple ascii format from symux.
