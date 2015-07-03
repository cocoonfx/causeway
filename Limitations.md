

### What Causeway doesn't do... ###

So, you've seen what Causeway can do; you should be aware of what it doesn't do.

  * Causeway does not display data state. We do not capture data during logging. We log and display distributed control flow.

  * Causeway is not primarily a visualization tool, although it can help explain program behavior.

  * Causeway is not a performance analysis tool. We added (optional) timestamps to the log records but have always thought of these as _good-enough_ timestamps that help identify performance outliers and liveness bugs.

Causeway is a distributed debugger used to understand program behavior for correctness, primarily during development and testing. The cognitive effort of debugging includes mapping observed behavior to a mental model of the original intentions, to discover misconceptions as well as semantic and logic errors. Watching program execution at an appropriate level of detail and without interruption, supports this effort. Our development tools support this well in the case of sequential single-thread computation. Our primary objective is to make a significant contribution to improving debugging support for the increasing number of developers writing asynchronous distributed applications.
