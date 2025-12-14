---
title: Complete Guide to Linux Performance Analysis
date: 2025-12-14
description: Comprehensive guide to tools and techniques for analyzing system performance on Linux
tags: [linux, performance, profiling, monitoring]
---

# Complete Guide to Linux Performance Analysis

A comprehensive guide to system performance analysis, demonstrating automatic table of contents navigation.

## Introduction

Performance analysis is a critical skill for any system engineer. This guide covers essential tools and methodologies.

### Why Performance Analysis Matters

Proper performance analysis enables you to:

- Identify system bottlenecks
- Optimize resource utilization
- Prevent issues before they occur
- Reduce infrastructure costs

### Key Metrics

When analyzing performance, monitor:

1. CPU utilization
2. Memory usage
3. Disk I/O
4. Network throughput
5. Application latency

## CPU Analysis

CPU is one of the most critical system resources.

### Basic CPU Metrics

Key indicators to monitor:

- **User time** - time spent in user processes
- **System time** - time spent in system calls
- **Idle time** - processor idle time
- **Wait time** - time waiting for I/O operations

### CPU Analysis Tools

#### top and htop

Classic real-time monitoring utilities:

```bash
top -b -n 1
htop
```

#### perf

Powerful profiling tool:

```bash
perf record -F 99 -a -g -- sleep 30
perf report
```

#### eBPF and bpftrace

Modern tracing tools:

```bash
bpftrace -e 'profile:hz:99 { @[kstack] = count(); }'
```

### CPU Flame Graphs

Flame graphs are excellent for profile visualization:

```bash
perf record -F 99 -a -g -- sleep 30
perf script | stackcollapse-perf.pl | flamegraph.pl > flame.svg
```

## Memory Analysis

Memory is the second most important resource after CPU.

### Memory Types in Linux

Linux uses a sophisticated memory management system:

#### Physical Memory

- **RAM** - main memory
- **Swap** - disk space for page swapping

#### Virtual Memory

- **RSS** (Resident Set Size) - process physical memory
- **VSZ** (Virtual Size) - process virtual memory

### Page Cache and Buffer Cache

Linux aggressively caches data:

```bash
free -h
cat /proc/meminfo
```

### Memory Pressure Stall Information (PSI)

Modern way to measure memory pressure:

```bash
cat /proc/pressure/memory
```

Example output:

```
some avg10=0.00 avg60=0.00 avg300=0.00 total=0
full avg10=0.00 avg60=0.00 avg300=0.00 total=0
```

### Memory Leaks

How to find and analyze memory leaks.

#### Valgrind

```bash
valgrind --leak-check=full ./myapp
```

#### heaptrack

Modern alternative for heap analysis:

```bash
heaptrack ./myapp
heaptrack_gui heaptrack.myapp.1234.gz
```

## Disk Subsystem Analysis

The disk subsystem often becomes a bottleneck.

### Storage Types

Modern systems use various types:

- **HDD** - hard disk drives (slow, cheap)
- **SSD** - solid state drives (fast, more expensive)
- **NVMe** - ultra-fast SSDs with PCIe interface

### Disk Subsystem Metrics

Important indicators:

#### IOPS

Input/Output Operations Per Second:

```bash
iostat -xz 1
```

#### Latency

Read/write operation latency:

```bash
iotop -o
```

#### Throughput

Bandwidth in MB/s:

```bash
dd if=/dev/zero of=/tmp/test bs=1M count=1024
```

### File Systems

Different filesystems have different characteristics.

#### ext4

Standard for many distributions:

```bash
tune2fs -l /dev/sda1
```

#### XFS

Optimized for large files:

```bash
xfs_info /mnt/data
```

#### Btrfs

Modern FS with snapshots and compression:

```bash
btrfs filesystem usage /
```

## Network Analysis

Network subsystem is critical for distributed systems.

### Network Metrics

Key indicators:

- **Bandwidth** - throughput capacity
- **Latency** - delay
- **Packet loss** - dropped packets
- **Jitter** - latency variation

### Network Analysis Tools

#### netstat and ss

View network connections:

```bash
ss -tunap
netstat -tulpn
```

#### tcpdump

Capture network packets:

```bash
tcpdump -i eth0 -nn port 80
```

#### iperf3

Measure bandwidth:

```bash
# On server
iperf3 -s

# On client
iperf3 -c server.example.com
```

### TCP Tuning

Optimize TCP parameters:

```bash
sysctl -w net.ipv4.tcp_congestion_control=bbr
sysctl -w net.core.rmem_max=134217728
sysctl -w net.core.wmem_max=134217728
```

## Application Profiling

Performance analysis at the application level.

### CPU Profiling

Profile CPU usage.

#### Go applications

```bash
go test -cpuprofile=cpu.prof
go tool pprof cpu.prof
```

#### Python applications

```python
import cProfile
cProfile.run('my_function()')
```

#### Rust applications

```bash
cargo flamegraph
```

### Memory Profiling

Analyze application memory usage.

#### Go memory profiling

```bash
go test -memprofile=mem.prof
go tool pprof mem.prof
```

#### Python memory profiling

```bash
pip install memory_profiler
python -m memory_profiler script.py
```

### Continuous Profiling

Continuous profiling in production:

- **Pyroscope** - continuous profiling platform
- **Parca** - eBPF-based profiler
- **Google Cloud Profiler**

## Production Monitoring

How to organize monitoring in production.

### Metrics

Collect and analyze metrics:

#### Prometheus

```yaml
scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
```

#### Grafana

Visualize metrics with beautiful dashboards.

### Logs

Centralized logging:

#### Loki

Prometheus for logs:

```bash
promtail -config.file=promtail.yaml
```

#### ELK Stack

Elasticsearch, Logstash, Kibana for large volumes.

### Traces

Distributed tracing for microservices:

#### Jaeger

```go
span := tracer.StartSpan("operation")
defer span.Finish()
```

#### Tempo

Grafana Tempo for trace storage.

## Performance Optimization

Practical optimization tips.

### CPU Optimization

How to optimize CPU usage:

1. Avoid locks
2. Use lock-free data structures
3. Optimize hot paths
4. Profile before optimizing

### Memory Optimization

Reduce memory consumption:

1. Use object pooling
2. Avoid memory leaks
3. Optimize data structures
4. Use arenas for allocations

### I/O Optimization

Optimize disk operations:

1. Use batching
2. Apply async I/O
3. Configure read-ahead
4. Use mmap for large files

## Troubleshooting

Solving common performance problems.

### High CPU Usage

What to do with high CPU load:

1. Find processes with `top`
2. Profile with `perf`
3. Check context switches
4. Look for spin-locks

### Memory Leaks

Finding and fixing memory leaks:

1. Monitor RSS over time
2. Use heaptrack or valgrind
3. Check caches and buffers
4. Analyze heap dumps

### Disk Bottlenecks

Disk subsystem issues:

1. Check IOPS with `iostat`
2. Find slow processes with `iotop`
3. Optimize database queries
4. Consider using SSDs

## Best Practices

Performance analysis best practices.

### Measure, Don't Guess

Always profile before optimizing:

!!! tip "Golden Rule"
    Premature optimization is the root of all evil.

### Set SLOs

Service Level Objectives help define goals:

| Metric | SLO | Criticality |
|--------|-----|-------------|
| Latency p99 | < 100ms | High |
| Error rate | < 0.1% | Critical |
| Availability | > 99.9% | Critical |

### Automate

Automation is critical for production:

- Continuous profiling
- Automatic alerts
- Capacity planning
- Performance regression tests

## Tools and Resources

Useful links and tools.

### Books

Recommended reading:

1. **Systems Performance** by Brendan Gregg
2. **The Linux Programming Interface** by Michael Kerrisk
3. **BPF Performance Tools** by Brendan Gregg

### Online Resources

- [Brendan Gregg's Blog](http://www.brendangregg.com/)
- [Julia Evans' Blog](https://jvns.ca/)
- [Use The Index, Luke!](https://use-the-index-luke.com/)

### Tools

List of useful tools:

- **perf** - CPU profiling
- **bpftrace** - eBPF tracing
- **flamegraph** - Visualization
- **Grafana** - Dashboards
- **Prometheus** - Metrics

## Conclusion

Performance analysis is both an art and a science.

### Key Takeaways

Main points from the guide:

1. Always start with measurements
2. Profile the entire stack
3. Automate monitoring
4. Consider trade-offs
5. Document findings

### Next Steps

Continue learning:

- Study eBPF in depth
- Practice on real systems
- Contribute to open source projects
- Share knowledge with the community

---

*This guide will be updated as new tools and methodologies emerge.*

