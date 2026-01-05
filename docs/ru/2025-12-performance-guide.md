---
title: Полное руководство по анализу производительности Linux
date: 2025-12-14
description: Подробное руководство по инструментам и методикам анализа производительности систем на базе Linux
tags: [linux, performance, profiling, monitoring]
---

# Полное руководство по анализу производительности Linux

Это подробное руководство по анализу производительности систем, демонстрирующее работу автоматической навигации по заголовкам.

## Введение

Анализ производительности - критически важный навык для любого системного инженера. В этом руководстве мы рассмотрим основные инструменты и методики.

### Зачем нужен анализ производительности

Правильный анализ производительности позволяет:

- Выявлять узкие места в системе
- Оптимизировать использование ресурсов
- Предотвращать проблемы до их возникновения
- Снижать затраты на инфраструктуру

### Основные метрики

При анализе производительности нужно следить за:

1. CPU utilization
2. Memory usage
3. Disk I/O
4. Network throughput
5. Application latency

## Анализ CPU

CPU - один из самых важных ресурсов в системе.

### Базовые метрики CPU

Основные показатели для мониторинга:

- **User time** - время выполнения пользовательских процессов
- **System time** - время выполнения системных вызовов
- **Idle time** - время простоя процессора
- **Wait time** - время ожидания I/O операций

### Инструменты для анализа CPU

#### top и htop

Классические утилиты для мониторинга в реальном времени:

```bash
top -b -n 1
htop
```

#### perf

Мощный инструмент для профилирования:

```bash
perf record -F 99 -a -g -- sleep 30
perf report
```

#### eBPF и bpftrace

Современные инструменты трассировки:

```bash
bpftrace -e 'profile:hz:99 { @[kstack] = count(); }'
```

### CPU Flame Graphs

Flame graphs - отличный способ визуализации профилей:

```bash
perf record -F 99 -a -g -- sleep 30
perf script | stackcollapse-perf.pl | flamegraph.pl > flame.svg
```

## Анализ памяти

Память - второй по важности ресурс после CPU.

### Типы памяти в Linux

Linux использует сложную систему управления памятью:

#### Physical Memory

- **RAM** - основная оперативная память
- **Swap** - дисковое пространство для выгрузки страниц

#### Virtual Memory

- **RSS** (Resident Set Size) - физическая память процесса
- **VSZ** (Virtual Size) - виртуальная память процесса

### Page Cache и Buffer Cache

Linux агрессивно кэширует данные:

```bash
free -h
cat /proc/meminfo
```

### Memory Pressure Stall Information (PSI)

Современный способ измерения нагрузки на память:

```bash
cat /proc/pressure/memory
```

Пример вывода:

```
some avg10=0.00 avg60=0.00 avg300=0.00 total=0
full avg10=0.00 avg60=0.00 avg300=0.00 total=0
```

### Утечки памяти

Как искать и анализировать утечки памяти.

#### Valgrind

```bash
valgrind --leak-check=full ./myapp
```

#### heaptrack

Современная альтернатива для анализа heap:

```bash
heaptrack ./myapp
heaptrack_gui heaptrack.myapp.1234.gz
```

## Анализ дисковой подсистемы

Дисковая подсистема часто становится узким местом.

### Типы хранилищ

Современные системы используют различные типы:

- **HDD** - жесткие диски (медленные, дешевые)
- **SSD** - твердотельные накопители (быстрые, дороже)
- **NVMe** - сверхбыстрые SSD с интерфейсом PCIe

### Метрики дисковой подсистемы

Важные показатели:

#### IOPS

Input/Output Operations Per Second - количество операций в секунду:

```bash
iostat -xz 1
```

#### Latency

Задержка операций чтения/записи:

```bash
iotop -o
```

#### Throughput

Пропускная способность в MB/s:

```bash
dd if=/dev/zero of=/tmp/test bs=1M count=1024
```

### Файловые системы

Разные ФС имеют разные характеристики.

#### ext4

Стандартная для многих дистрибутивов:

```bash
tune2fs -l /dev/sda1
```

#### XFS

Оптимизирована для больших файлов:

```bash
xfs_info /mnt/data
```

#### Btrfs

Современная ФС с snapshot и compression:

```bash
btrfs filesystem usage /
```

## Анализ сети

Сетевая подсистема критична для распределенных систем.

### Сетевые метрики

Основные показатели:

- **Bandwidth** - пропускная способность
- **Latency** - задержка
- **Packet loss** - потеря пакетов
- **Jitter** - дрожание задержки

### Инструменты сетевого анализа

#### netstat и ss

Просмотр сетевых соединений:

```bash
ss -tunap
netstat -tulpn
```

#### tcpdump

Захват сетевых пакетов:

```bash
tcpdump -i eth0 -nn port 80
```

#### iperf3

Измерение пропускной способности:

```bash
# На сервере
iperf3 -s

# На клиенте
iperf3 -c server.example.com
```

### TCP Tuning

Оптимизация параметров TCP:

```bash
sysctl -w net.ipv4.tcp_congestion_control=bbr
sysctl -w net.core.rmem_max=134217728
sysctl -w net.core.wmem_max=134217728
```

## Профилирование приложений

Анализ производительности на уровне приложений.

### CPU Profiling

Профилирование использования CPU.

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

Анализ использования памяти приложением.

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

Постоянное профилирование в production:

- **Pyroscope** - continuous profiling platform
- **Parca** - eBPF-based profiler
- **Google Cloud Profiler**

## Мониторинг в Production

Как организовать мониторинг в продакшене.

### Метрики (Metrics)

Сбор и анализ метрик:

#### Prometheus

```yaml
scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
```

#### Grafana

Визуализация метрик с красивыми дашбордами.

### Логи (Logs)

Централизованное логирование:

#### Loki

Prometheus для логов:

```bash
promtail -config.file=promtail.yaml
```

#### ELK Stack

Elasticsearch, Logstash, Kibana для больших объемов.

### Трассировки (Traces)

Distributed tracing для микросервисов:

#### Jaeger

```go
span := tracer.StartSpan("operation")
defer span.Finish()
```

#### Tempo

Grafana Tempo для хранения трассировок.

## Оптимизация производительности

Практические советы по оптимизации.

### CPU Optimization

Как оптимизировать использование CPU:

1. Избегайте блокировок
2. Используйте lock-free структуры данных
3. Оптимизируйте горячие пути
4. Профилируйте перед оптимизацией

### Memory Optimization

Снижение потребления памяти:

1. Используйте object pooling
2. Избегайте утечек памяти
3. Оптимизируйте структуры данных
4. Используйте арены для аллокаций

### I/O Optimization

Оптимизация дисковых операций:

1. Используйте батчинг
2. Применяйте async I/O
3. Настройте read-ahead
4. Используйте mmap для больших файлов

## Troubleshooting

Решение типичных проблем производительности.

### High CPU Usage

Что делать при высокой загрузке CPU:

1. Найти процессы с помощью `top`
2. Профилировать с помощью `perf`
3. Проверить контекстные переключения
4. Искать spin-locks

### Memory Leaks

Поиск и устранение утечек памяти:

1. Мониторить RSS с течением времени
2. Использовать heaptrack или valgrind
3. Проверить кэши и буферы
4. Анализировать heap dumps

### Disk Bottlenecks

Проблемы с дисковой подсистемой:

1. Проверить IOPS с помощью `iostat`
2. Найти медленные процессы через `iotop`
3. Оптимизировать запросы к БД
4. Рассмотреть использование SSD

## Best Practices

Лучшие практики анализа производительности.

### Измеряйте, не гадайте

Всегда профилируйте перед оптимизацией:

!!! tip "Золотое правило"
    Преждевременная оптимизация - корень всех зол.

### Устанавливайте SLO

Service Level Objectives помогают определить цели:

| Метрика | SLO | Критичность |
|---------|-----|-------------|
| Latency p99 | < 100ms | Высокая |
| Error rate | < 0.1% | Критичная |
| Availability | > 99.9% | Критичная |

### Автоматизируйте

Автоматизация критична для production:

- Continuous profiling
- Автоматические алерты
- Capacity planning
- Performance regression tests

## Инструменты и ресурсы

Полезные ссылки и инструменты.

### Книги

Рекомендуемая литература:

1. **Systems Performance** by Brendan Gregg
2. **The Linux Programming Interface** by Michael Kerrisk
3. **BPF Performance Tools** by Brendan Gregg

### Онлайн ресурсы

- [Brendan Gregg's Blog](http://www.brendangregg.com/)
- [Julia Evans' Blog](https://jvns.ca/)
- [Use The Index, Luke!](https://use-the-index-luke.com/)

### Инструменты

Список полезных инструментов:

- **perf** - CPU profiling
- **bpftrace** - eBPF tracing
- **flamegraph** - Визуализация
- **Grafana** - Dashboards
- **Prometheus** - Метрики

## Заключение

Анализ производительности - это искусство и наука одновременно.

### Ключевые выводы

Основные тезисы из руководства:

1. Всегда начинайте с измерений
2. Профилируйте весь стек
3. Автоматизируйте мониторинг
4. Учитывайте trade-offs
5. Документируйте находки

### Следующие шаги

Продолжайте изучать:

- Углубленно изучите eBPF
- Практикуйтесь на реальных системах
- Участвуйте в open source проектах
- Делитесь знаниями с коммьюнити

---

*Это руководство будет обновляться по мере появления новых инструментов и методик.*





