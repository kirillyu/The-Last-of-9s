/*
 * runtime-sheet.js - шпаргалки блока 4 на движке сайта.
 *
 * Композиция и стиль авторские, как на исходных схемах в Excalidraw: рукописный шрифт (Excalifont), скругленные
 * рамки со штриховкой, сервер на 128 CPU, внутри контейнеры сверху вниз, в каждом приложение со значениями,
 * справа cpu, memory, env или args, пунктирные стрелки от значения к источнику, справа колонка заметок.
 * Значения сверены с исходниками и документацией рантаймов.
 *
 * Живое: переключатели версий, подсветка контейнера при наведении, стрелки появляются по очереди,
 * "развернуть" показывает схему в натуральную величину, "PNG" сохраняет ее со встроенным шрифтом.
 *
 * Разметка: <div class="rt-sheet" data-sheet="go"></div>, листы: jvm11, jvm21, go, node, python, ruby, php, dotnet.
 * rough.js (window.rough) для рисованного вида, без него обычный SVG.
 */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  // ------------------------------------------------------------------ данные
  /*
   * value: {t: текст, to: 'server' | id строки справа | null, bad: значение-ловушка, dim: второстепенное}
   * spec:  {t: текст, id?: цель стрелки, head?: заголовок секции (cpu:, memory:), flag?: флаг или env}
   */
  var SHEETS = {
    go: {
      title: 'Go',
      model: 'Runtime model: горутины на OS-потоках (M:N)',
      toggles: [{ key: 'gomod', label: 'go.mod', options: [['1.24', 'go.mod 1.24'], ['1.25', 'go.mod 1.25']], value: '1.25' }],
      containers: function (s) {
        var old = s.gomod === '1.24';
        return [
          { name: 'container A', mode: 'наивный', app: 'Application A (Go)',
            values: [
              old ? { t: 'GOMAXPROCS = 128', to: 'server', bad: true } : { t: 'GOMAXPROCS = 2', to: 'a-cpu-limit' },
              { t: 'NumCPU() = 128 (ядра ноды)', dim: true },
              { t: 'GOMEMLIMIT: нет', bad: true }
            ],
            spec: [{ t: 'cpu:', head: true }, { t: 'requests: 1' }, { t: 'limits: 2', id: 'a-cpu-limit' },
              { t: 'memory:', head: true }, { t: 'requests: 1Gi' }, { t: 'limits: 1Gi' }] },
          { name: 'container B', mode: 'без лимитов', app: 'Application B (Go)',
            values: [{ t: 'GOMAXPROCS = 128', to: 'server', bad: true }, { t: 'NumCPU() = 128 (ядра ноды)', dim: true },
              { t: 'GOMEMLIMIT: нет', bad: true }],
            spec: [{ t: 'cpu:', head: true }, { t: 'requests: 1' }, { t: 'memory:', head: true }, { t: 'requests: 1Gi' }, { t: 'limits: 1Gi' }] },
          { name: 'container C', mode: 'идеальный', app: 'Application C (Go)',
            values: [{ t: 'GOMAXPROCS = 1', to: 'c-gomaxprocs' }, { t: 'NumCPU() = 128 (ядра ноды)', dim: true },
              { t: 'GOMEMLIMIT = 900 MiB', to: 'c-gomemlimit' }],
            spec: [{ t: 'cpu:', head: true }, { t: 'requests: 1' }, { t: 'memory:', head: true }, { t: 'requests: 1Gi' }, { t: 'limits: 1Gi' },
              { t: 'env:', head: true }, { t: 'GOMAXPROCS=1', id: 'c-gomaxprocs', flag: true }, { t: 'GOMEMLIMIT=900MiB', id: 'c-gomemlimit', flag: true }] }
        ];
      },
      notes: [
        { h: 'CPU в Go' },
        'GOMAXPROCS: сколько OS-потоков одновременно исполняют Go-код.',
        'runtime.NumCPU() квоту не видит никогда, только cpuset.',
        'До Go 1.25 лимиты не читаются: GOMAXPROCS равен числу ядер ноды.',
        'С Go 1.25 (go 1.25 в go.mod) GOMAXPROCS берется из CPU limit, но не меньше 2. requests он не видит.',
        { h: 'Рекомендации' },
        'Задайте GOMAXPROCS из requests через переменную окружения.',
        'automaxprocs тоже читает только limit.',
        'GOMEMLIMIT ставьте в 70-90% от limits.memory: сам Go лимит памяти не читает.',
        { small: 'Горутины раскладывает по OS-потокам (pthread) планировщик Go.' }
      ]
    },
    jvm11: {
      title: 'JVM 11+',
      model: 'Runtime model: пул потоков (Tomcat, Jetty), event loop (Netty)',
      toggles: [],
      containers: function () {
        return [
          { name: 'container A', mode: 'наивный', app: 'Application A (JVM)',
            values: [{ t: 'availableProcessors() = 2', to: 'a-cpu-limit' }, { t: 'Xmx = 256 MiB (25%)', to: 'a-mem-limit' },
              { t: 'Xms = 16 MiB', to: 'a-mem-limit', dim: true }, { t: 'Metaspace: без лимита', bad: true },
              { t: 'DirectMemory: до Xmx', dim: true }, { t: 'GC: Serial, 1 поток', dim: true }],
            spec: [{ t: 'cpu:', head: true }, { t: 'requests: 1' }, { t: 'limits: 2', id: 'a-cpu-limit' },
              { t: 'memory:', head: true }, { t: 'requests: 1Gi' }, { t: 'limits: 1Gi', id: 'a-mem-limit' }] },
          { name: 'container B', mode: 'без лимитов', app: 'Application B (JVM)',
            values: [{ t: 'availableProcessors() = 128', to: 'server', bad: true }, { t: 'Xmx = 256 MiB (25%)', to: 'b-mem-limit' },
              { t: 'Xms = 16 MiB', to: 'b-mem-limit', dim: true }, { t: 'Metaspace: без лимита', bad: true },
              { t: 'DirectMemory: до Xmx', dim: true }],
            spec: [{ t: 'cpu:', head: true }, { t: 'requests: 1' }, { t: 'memory:', head: true }, { t: 'requests: 1Gi' }, { t: 'limits: 1Gi', id: 'b-mem-limit' }] },
          { name: 'container C', mode: 'идеальный', app: 'Application C (JVM)',
            values: [{ t: 'availableProcessors() = 1', to: 'c-apc' }, { t: 'Xmx = 718 MiB (70%)', to: 'c-mrp' },
              { t: 'Metaspace: до 128 MiB', to: 'c-meta' }, { t: 'DirectMemory: до 128 MiB', to: 'c-direct' }],
            spec: [{ t: 'cpu:', head: true }, { t: 'requests: 1' }, { t: 'memory:', head: true }, { t: 'requests: 1Gi' }, { t: 'limits: 1Gi' },
              { t: 'args:', head: true }, { t: '-XX:ActiveProcessorCount=1', id: 'c-apc', flag: true }, { t: '-XX:MaxRAMPercentage=70', id: 'c-mrp', flag: true },
              { t: '-XX:MaxMetaspaceSize=128m', id: 'c-meta', flag: true }, { t: '-XX:MaxDirectMemorySize=128m', id: 'c-direct', flag: true }] }
        ];
      },
      notes: [
        { h: 'Что зависит от числа CPU в JVM' },
        'ForkJoinPool.commonPool: CPU - 1 потоков (parallelStream, CompletableFuture).',
        'Потоки GC (у Serial GC всегда 1).',
        'Event loop: Netty 2 x CPU, Undertow io = CPU.',
        'Tomcat и Jetty: 200 потоков, от CPU не зависят.',
        'Свой код: Executors.newFixedThreadPool(availableProcessors()).',
        { h: 'Память JVM в контейнере (JDK 11+)' },
        'Xmx = 25% от limits.memory (MaxRAMPercentage=25).',
        'Xms по умолчанию маленький: 16 MiB при лимите 1 GiB, а не равен Xmx.',
        'Metaspace не ограничен, direct memory по умолчанию до Xmx.',
        'CompressedClassSpaceSize: 1 ГиБ адресов, в RSS только занятое.',
        'Стек потока: 1 МБ на x64, 2 МБ на arm64.',
        'При памяти меньше 2 ГиБ JVM берет Serial GC.',
        { h: 'Рекомендации' },
        'Задайте MaxRAMPercentage, MaxMetaspaceSize, MaxDirectMemorySize.',
        'Сумма лимитов плюс стеки, JIT и GC должна влезть в limits.memory. Универсального числа нет.',
        { small: 'Потоки JVM один к одному ложатся на OS-потоки (pthread).' }
      ]
    },

    jvm21: {
      title: 'JVM 21+ Project Loom',
      model: 'Runtime model: виртуальные потоки (Project Loom, Java 21+)',
      toggles: [{ key: 'jdk', label: 'JDK', options: [['21', 'JDK 21'], ['25', 'JDK 25']], value: '21' }],
      containers: function () {
        return [
          { name: 'container A', mode: 'наивный', app: 'Application A (JVM)',
            values: [{ t: 'availableProcessors() = 2', to: 'a-cpu-limit' }, { t: 'VT parallelism = 2', to: 'a-cpu-limit' },
              { t: 'Xmx = 256 MiB (25%)', to: 'a-mem-limit' }, { t: 'Metaspace: без лимита', bad: true }, { t: 'DirectMemory: до Xmx', dim: true }],
            spec: [{ t: 'cpu:', head: true }, { t: 'requests: 1' }, { t: 'limits: 2', id: 'a-cpu-limit' },
              { t: 'memory:', head: true }, { t: 'requests: 1Gi' }, { t: 'limits: 1Gi', id: 'a-mem-limit' }] },
          { name: 'container B', mode: 'без лимитов', app: 'Application B (JVM)',
            values: [{ t: 'availableProcessors() = 128', to: 'server', bad: true }, { t: 'VT parallelism = 128', to: 'server', bad: true },
              { t: 'Xmx = 256 MiB (25%)', to: 'b-mem-limit' }, { t: 'Metaspace: без лимита', bad: true }, { t: 'DirectMemory: до Xmx', dim: true }],
            spec: [{ t: 'cpu:', head: true }, { t: 'requests: 1' }, { t: 'memory:', head: true }, { t: 'requests: 1Gi' }, { t: 'limits: 1Gi', id: 'b-mem-limit' }] },
          { name: 'container C', mode: 'идеальный', app: 'Application C (JVM)',
            values: [{ t: 'availableProcessors() = 1', to: 'c-apc' }, { t: 'VT parallelism = 1', to: 'c-apc' },
              { t: 'Xmx = 718 MiB (70%)', to: 'c-mrp' }, { t: 'Metaspace: до 128 MiB', to: 'c-meta' }, { t: 'DirectMemory: до 128 MiB', to: 'c-direct' }],
            spec: [{ t: 'cpu:', head: true }, { t: 'requests: 1' }, { t: 'memory:', head: true }, { t: 'requests: 1Gi' }, { t: 'limits: 1Gi' },
              { t: 'args:', head: true }, { t: '-XX:ActiveProcessorCount=1', id: 'c-apc', flag: true }, { t: '-XX:MaxRAMPercentage=70', id: 'c-mrp', flag: true },
              { t: '-XX:MaxMetaspaceSize=128m', id: 'c-meta', flag: true }, { t: '-XX:MaxDirectMemorySize=128m', id: 'c-direct', flag: true }] }
        ];
      },
      notes: function (s) {
        var j21 = s.jdk === '21';
        return [
          { h: 'Что меняется с Virtual Threads' },
          'От числа CPU зависит и пул carrier-потоков: parallelism = availableProcessors().',
          '-XX:ActiveProcessorCount=1 задает и его. Флаг jdk.virtualThreadScheduler.parallelism нужен, только если хочется другое число.',
          'jdk.virtualThreadScheduler.maxPoolSize: до скольких carrier-потоков пул может вырасти (по умолчанию 256).',
          { h: j21 ? 'Pinning в JDK 21' : 'Pinning в JDK 25' },
          j21 ? 'Внутри synchronized и в native-коде виртуальный поток держит carrier вместе с собой.'
            : 'synchronized больше не пинит (с JDK 24), держит carrier только native-код.',
          j21 ? 'Искать: -Djdk.tracePinnedThreads=full или JFR jdk.VirtualThreadPinned.'
            : 'Искать: JFR jdk.VirtualThreadPinned (флаг tracePinnedThreads удален).',
          { h: 'maxPoolSize (опыт автора)' },
          'Fail-fast и предсказуемость: parallelism или 2 x parallelism.',
          'Смешанная нагрузка, редкий pinning: 4-8 x parallelism.',
          'Больше 16 x parallelism только после замеров: обычно это прячет баги.',
          { h: 'Память' },
          'Тяжелые ThreadLocal под миллионами виртуальных потоков растят heap: для контекста запроса лучше ScopedValue.',
          'Стек виртуального потока лежит в heap, своего стека OS-потока у него нет.',
          { small: 'Только тяжелые потоки JVM ложатся на OS-потоки (pthread). Виртуальные нет.' }
        ];
      }
    },

    node: {
      title: 'Node.js 18+',
      model: 'Runtime model: event loop, пул потоков libuv для fs, dns, crypto',
      toggles: [],
      containers: function () {
        return [
          { name: 'container A', mode: 'наивный', app: 'Application A (Node.js)',
            values: [{ t: 'event loop: 1 поток' }, { t: 'libuv pool: 4 потока (по умолчанию)', dim: true },
              { t: 'os.cpus().length = 128 (ядра ноды)', dim: true }, { t: 'os.availableParallelism() = 2', to: 'a-cpu-limit' }],
            spec: [{ t: 'cpu:', head: true }, { t: 'requests: 1' }, { t: 'limits: 2', id: 'a-cpu-limit' },
              { t: 'memory:', head: true }, { t: 'requests: 1Gi' }, { t: 'limits: 1Gi' }] },
          { name: 'container B', mode: 'без лимитов', app: 'Application B (Node.js)',
            values: [{ t: 'event loop: 1 поток' }, { t: 'libuv pool: 4 потока (по умолчанию)', dim: true },
              { t: 'os.cpus().length = 128 (ядра ноды)', dim: true }, { t: 'os.availableParallelism() = 128', to: 'server', bad: true }],
            spec: [{ t: 'cpu:', head: true }, { t: 'requests: 1' }, { t: 'memory:', head: true }, { t: 'requests: 1Gi' }, { t: 'limits: 1Gi' }] }
        ];
      },
      notes: [
        { h: 'CPU в Node.js' },
        'Сам Node.js по числу CPU потоки не создает: event loop один, пул libuv по умолчанию 4 (UV_THREADPOOL_SIZE).',
        'os.availableParallelism() видит квоту с Node 22.17 и 24.2 (2 при limits: 2), в Node 20 вернет 128. os.cpus() показывает все ядра.',
        'Event loop один на процесс. Параллелизм для JS: несколько процессов (cluster, реплики) или worker_threads, у каждого свой event loop.',
        'У процесса Node 22 в простое 7 OS-потоков (main, потоки V8 для GC и JIT). С первой задачей для libuv их 11: пул создается при первом обращении.',
        { h: 'Рекомендации' },
        '1 процесс на 1 CPU из requests, масштабируйтесь репликами или cluster.',
        'UV_THREADPOOL_SIZE поднимайте только при большой нагрузке на fs, dns и crypto.',
        { small: 'Все потоки Node.js это pthread в Linux.' }
      ]
    },

    python: {
      title: 'Python 3.8+',
      model: 'Runtime model: пул процессов (Gunicorn workers), event loop (Uvicorn, asyncio)',
      toggles: [],
      containers: function () {
        return [
          { name: 'container A', mode: 'наивный', app: 'Application A (Python)',
            values: [{ t: 'mode: 1 процесс, threads = 5' }, { t: 'os.cpu_count() = 128', to: 'server', bad: true },
              { t: 'GIL: Python-код в 1 потоке', dim: true }],
            spec: [{ t: 'cpu:', head: true }, { t: 'requests: 1' }, { t: 'limits: 2' },
              { t: 'memory:', head: true }, { t: 'requests: 1Gi' }, { t: 'limits: 1Gi' }] },
          { name: 'container B', mode: 'идеальный', app: 'Application B (Python)',
            values: [{ t: 'workers = 4 (4 процесса)', to: 'b-workers' }, { t: 'threads = 10', to: 'b-threads' },
              { t: 'os.cpu_count() = 128 (ядра ноды)', dim: true }],
            spec: [{ t: 'cpu:', head: true }, { t: 'requests: 4' }, { t: 'memory:', head: true }, { t: 'requests: 1Gi' }, { t: 'limits: 1Gi' },
              { t: 'args:', head: true }, { t: '--workers=4', id: 'b-workers', flag: true }, { t: '--threads=10', id: 'b-threads', flag: true }, { t: '--preload', flag: true }] }
        ];
      },
      notes: [
        { h: 'CPU в Python (CPython)' },
        'Квоту не видит: os.cpu_count() и os.process_cpu_count() показывают ядра ноды.',
        'GIL: в стандартной сборке байткод в один момент выполняет один поток, 1 GIL на процесс.',
        'Сборка без GIL с 3.14 поддерживается официально, но не по умолчанию.',
        'Потоки помогают на I/O. Для CPU-bound нужны процессы (gunicorn workers).',
        { h: 'Рекомендации' },
        '1 процесс = 1 CPU из requests.',
        'C-библиотеки ограничьте: OPENBLAS_NUM_THREADS=1 и аналоги.',
        'Потоки: 1 на CPU-bound, 8-10 на I/O-bound (опыт автора). Они умножаются на число процессов.',
        'preload: приложение грузится один раз до fork и экономит память. max-requests (+jitter) перезапускает воркеры.',
        { small: 'Воркеры это процессы Linux, threads это pthread.' }
      ]
    },

    ruby: {
      title: 'Ruby 3+',
      model: 'Runtime model: пул процессов (Puma workers, Unicorn), пул потоков (Puma)',
      toggles: [],
      containers: function () {
        return [
          { name: 'container A', mode: 'наивный', app: 'Application A (Ruby, Puma)',
            values: [{ t: 'mode: 1 процесс, threads = 5' }, { t: 'Etc.nprocessors = 128', to: 'server', bad: true },
              { t: 'Concurrent.available_processor_count = 2', to: 'a-cpu-limit' }],
            spec: [{ t: 'cpu:', head: true }, { t: 'requests: 1' }, { t: 'limits: 2', id: 'a-cpu-limit' },
              { t: 'memory:', head: true }, { t: 'requests: 1Gi' }, { t: 'limits: 1Gi' }] },
          { name: 'container B', mode: 'без лимитов', app: 'Application B (Ruby, Puma)',
            values: [{ t: 'mode: 1 процесс, threads = 5' }, { t: 'Etc.nprocessors = 128', to: 'server', bad: true },
              { t: 'Concurrent.available_processor_count = 128', to: 'server', bad: true }],
            spec: [{ t: 'cpu:', head: true }, { t: 'requests: 1' }, { t: 'memory:', head: true }, { t: 'requests: 1Gi' }, { t: 'limits: 1Gi' }] },
          { name: 'container C', mode: 'идеальный', app: 'Application C (Ruby, Puma)',
            values: [{ t: 'workers = 4 (4 процесса)', to: 'c-workers' }, { t: 'threads = 10', to: 'c-threads' },
              { t: 'Etc.nprocessors = 128 (ядра ноды)', dim: true }],
            spec: [{ t: 'cpu:', head: true }, { t: 'requests: 4' }, { t: 'memory:', head: true }, { t: 'requests: 1Gi' }, { t: 'limits: 1Gi' },
              { t: 'env:', head: true }, { t: 'WEB_CONCURRENCY=4', id: 'c-workers', flag: true }, { t: 'RAILS_MAX_THREADS=10', id: 'c-threads', flag: true }] }
        ];
      },
      notes: [
        { h: 'CPU в Ruby (MRI)' },
        'Etc.nprocessors квоту не видит никогда (sched_getaffinity), только cpuset.',
        'Concurrent.processor_count тоже. Квоту видит Concurrent.available_processor_count (concurrent-ruby 1.3+).',
        'Puma по умолчанию: 1 процесс и до 5 потоков. WEB_CONCURRENCY=auto (Puma 6.5+) берет available_processor_count.',
        'Sidekiq: concurrency 5 по умолчанию, от CPU не зависит.',
        { h: 'Процессы и потоки' },
        'GVL: Ruby-код в один момент выполняет один поток, даже с Thread.new. Потоки полезны для I/O.',
        'Реальный параллелизм только процессами (workers).',
        'Ractors обходят GVL, но пока незрелые и не дружат с популярными гемами (опыт автора).',
        { h: 'Рекомендации' },
        '1 Ruby-процесс = 1 CPU из requests: WEB_CONCURRENCY = requests.cpu.',
        'Потоки: 1 на CPU-bound, 8-10 на I/O-bound (опыт автора). Они умножаются на число процессов.',
        'Грязный хак для Puma, но работает: on_worker_boot { ActiveRecord::Base.establish_connection }.',
        { small: 'Воркеры это процессы Linux, RAILS_MAX_THREADS это pthread.' }
      ]
    },

    php: {
      title: 'PHP-FPM 7.4+',
      model: 'Runtime model: пул процессов (PHP-FPM)',
      toggles: [],
      containers: function () {
        return [
          { name: 'container A', mode: 'наивный', app: 'Application A (PHP-FPM)',
            values: [{ t: 'pm = dynamic', to: 'a-conf' }, { t: 'pm.max_children = 5', to: 'a-conf' },
              { t: 'nproc = 128 (ядра ноды)', dim: true }],
            spec: [{ t: 'cpu:', head: true }, { t: 'requests: 1' }, { t: 'limits: 2' },
              { t: 'memory:', head: true }, { t: 'requests: 1Gi' }, { t: 'limits: 1Gi' }, { t: 'www.conf из образа', id: 'a-conf', flag: true }] },
          { name: 'container B', mode: 'идеальный', app: 'Application B (PHP-FPM)',
            values: [{ t: 'pm = static', to: 'b-pm' }, { t: 'pm.max_children = 1', to: 'b-children' },
              { t: 'nproc = 128 (ядра ноды)', dim: true }],
            spec: [{ t: 'cpu:', head: true }, { t: 'requests: 1' }, { t: 'memory:', head: true }, { t: 'requests: 1Gi' }, { t: 'limits: 1Gi' },
              { t: 'args:', head: true }, { t: 'pm = static', id: 'b-pm', flag: true }, { t: 'pm.max_children = 1', id: 'b-children', flag: true }] }
        ];
      },
      notes: [
        { h: 'CPU в PHP-FPM' },
        'Число CPU PHP-FPM не использует: воркеров столько, сколько задано в pm.*.',
        'nproc и getconf _NPROCESSORS_ONLN квоту не видят (128).',
        'Пул процессов: каждый воркер живет долго и обслуживает один запрос за раз.',
        { h: 'Режимы' },
        'static: фиксированное число процессов (pm.max_children).',
        'dynamic: создает и убирает процессы (pm.start_servers и другие).',
        'ondemand: создает процессы только на входящие запросы.',
        { h: 'Рекомендации' },
        'Выбирайте static.',
        'pm.max_children = cpu.requests для CPU-bound, чуть больше для I/O-bound.',
        'Число процессов ограничено памятью: (limits.memory - opcache - накладные) / память на процесс.',
        'pm.max_requests = 500-1000 против утечек памяти в воркерах.',
        { small: 'Воркеры это процессы PHP-FPM, потоки в обработке запроса не участвуют.' }
      ]
    },

    dotnet: {
      title: '.NET 6+ / C#',
      model: 'Runtime model: пул потоков (Kestrel), event loop для сокетов',
      toggles: [],
      containers: function () {
        return [
          { name: 'container A', mode: 'наивный', app: 'Application A (.NET)',
            values: [{ t: 'Environment.ProcessorCount = 2', to: 'a-cpu-limit' }, { t: 'ThreadPool min = 2', to: 'a-cpu-limit' },
              { t: 'ThreadPool max = 32767', dim: true }],
            spec: [{ t: 'cpu:', head: true }, { t: 'requests: 1' }, { t: 'limits: 2', id: 'a-cpu-limit' },
              { t: 'memory:', head: true }, { t: 'requests: 1Gi' }, { t: 'limits: 1Gi' }] },
          { name: 'container B', mode: 'без лимитов', app: 'Application B (.NET)',
            values: [{ t: 'Environment.ProcessorCount = 128', to: 'server', bad: true }, { t: 'ThreadPool min = 128', to: 'server', bad: true },
              { t: 'ThreadPool max = 32767', dim: true }],
            spec: [{ t: 'cpu:', head: true }, { t: 'requests: 1' }, { t: 'memory:', head: true }, { t: 'requests: 1Gi' }, { t: 'limits: 1Gi' }] },
          { name: 'container C', mode: 'идеальный', app: 'Application C (.NET)',
            values: [{ t: 'Environment.ProcessorCount = 1', to: 'c-pc' }, { t: 'ThreadPool min = 1', to: 'c-pc' },
              { t: 'GC: Workstation (1 CPU)', to: 'c-pc' }],
            spec: [{ t: 'cpu:', head: true }, { t: 'requests: 1' }, { t: 'memory:', head: true }, { t: 'requests: 1Gi' }, { t: 'limits: 1Gi' },
              { t: 'env:', head: true }, { t: 'DOTNET_PROCESSOR_COUNT=1', id: 'c-pc', flag: true }, { t: 'DOTNET_gcServer=1', id: 'c-gc', flag: true }] }
        ];
      },
      notes: [
        { h: 'CPU в .NET' },
        'Квоту видит: Environment.ProcessorCount = меньшее из ядер, affinity и CPU limit (лимит округляется вверх).',
        'ThreadPool: минимум = ProcessorCount, максимум 32767 на 64-bit (.NET 9).',
        'Server GC в ASP.NET Core включен по умолчанию.',
        { h: 'Рекомендации' },
        'DOTNET_PROCESSOR_COUNT = requests: его видят все пулы и GC.',
        'DOTNET_gcServer=1 нужен для консольных и worker-сервисов, в ASP.NET Core он уже включен. При 1 CPU рантайм все равно берет Workstation GC.',
        'DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1, если ICU не нужен.',
        { small: 'Потоки .NET один к одному ложатся на OS-потоки (pthread).' }
      ]
    }
  };

  // ------------------------------------------------------------------ Excalidraw look
  // One hand-drawn font for every label, like the original Excalidraw sheets. Excalifont is Virgil with Cyrillic,
  // SIL Open Font License 1.1, two subsets loaded by unicode range.
  var FONT_BASE = 'https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@0.18.0/dist/prod/fonts/Excalifont/';
  var FONT_FILES = [
    { file: 'Excalifont-Regular-a88b72a24fb54c9f94e3b5fdaa7481c9.woff2',
      range: 'U+20-7e,U+a0-a3,U+a5-a6,U+a8-ab,U+ad-b1,U+b4,U+b6-b8,U+ba-ff,U+131,U+152-153,U+2bc,U+2c6,U+2da,U+2dc,U+304,U+308,U+2013-2014,U+2018-201a,U+201c-201e,U+2020,U+2022,U+2024-2026,U+2030,U+2039-203a,U+20ac,U+2122,U+2212' },
    { file: 'Excalifont-Regular-b9dcf9d2e50a1eaf42fc664b50a3fd0d.woff2', range: 'U+400-45f,U+490-491,U+2116' }
  ];
  var FONT = 'Excalifont, "Comic Sans MS", cursive';
  var INK_RED = '#e03131';
  var FILL_BLUE = '#a5d8ff', FILL_GREEN = '#b2f2bb';

  var fontsReady = null;
  function loadFonts() {
    if (fontsReady) return fontsReady;
    if (!window.FontFace || !document.fonts) return (fontsReady = Promise.resolve());
    fontsReady = Promise.all(FONT_FILES.map(function (f) {
      var face = new FontFace('Excalifont', 'url(' + FONT_BASE + f.file + ') format("woff2")', { unicodeRange: f.range });
      document.fonts.add(face);
      return face.load().catch(function () {});
    })).then(function () {});
    return fontsReady;
  }

  // ------------------------------------------------------------------ svg helpers
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  var HALO = null; // background color of the current drawing, set by draw()
  function text(g, x, y, s, o) {
    o = o || {};
    var t = el('text', { x: x, y: y, fill: o.fill, 'font-size': o.size || 16, 'font-family': FONT, 'text-anchor': o.anchor || 'start' }, g);
    if (o.halo && HALO) { t.setAttribute('stroke', HALO); t.setAttribute('stroke-width', 3); t.setAttribute('stroke-linejoin', 'round'); t.setAttribute('paint-order', 'stroke'); }
    t.textContent = s;
    return t;
  }

  // text width, measured in a hidden svg so arrows start exactly at the end of a value
  var meter = null;
  function width(s, size) {
    if (!meter) {
      meter = el('svg', { width: 0, height: 0, style: 'position:absolute;left:-9999px;top:-9999px', 'aria-hidden': 'true' });
      document.body.appendChild(meter);
    }
    var t = text(meter, 0, 0, s, { size: size });
    var w = t.getComputedTextLength();
    meter.removeChild(t);
    return w;
  }
  function wrap(s, size, maxW) {
    var out = [], line = '', words = [];
    // a word longer than the line (a Java call) is cut after dots and brackets
    s.split(' ').forEach(function (w) {
      if (width(w, size) <= maxW) { words.push({ t: w, glue: false }); return; }
      w.split(/(?<=[.(_=])/).forEach(function (p, i) { words.push({ t: p, glue: i > 0 }); });
    });
    words.forEach(function (w) {
      var tryLine = line ? line + (w.glue ? '' : ' ') + w.t : w.t;
      if (line && width(tryLine, size) > maxW) { out.push(line); line = w.t; } else line = tryLine;
    });
    if (line) out.push(line);
    return out;
  }

  function Pen(svg) { this.rc = window.rough ? window.rough.svg(svg) : null; }
  // rounded rectangle with Excalidraw hachure fill
  Pen.prototype.box = function (g, x, y, w, h, o) {
    var r = Math.min(o.r == null ? 14 : o.r, w / 4, h / 4);
    var d = 'M' + (x + r) + ' ' + y + ' H' + (x + w - r) + ' Q' + (x + w) + ' ' + y + ' ' + (x + w) + ' ' + (y + r) +
      ' V' + (y + h - r) + ' Q' + (x + w) + ' ' + (y + h) + ' ' + (x + w - r) + ' ' + (y + h) +
      ' H' + (x + r) + ' Q' + x + ' ' + (y + h) + ' ' + x + ' ' + (y + h - r) +
      ' V' + (y + r) + ' Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + ' Z';
    if (this.rc) {
      g.appendChild(this.rc.path(d, { seed: o.seed || 1, roughness: o.rough != null ? o.rough : 1, bowing: 1,
        stroke: o.stroke, strokeWidth: o.sw || 1.2, fill: o.fill, fillStyle: o.fillStyle || 'hachure', hachureGap: o.gap || 9, hachureAngle: -41, fillWeight: 0.6 }));
    } else {
      el('path', { d: d, fill: o.fill || 'none', 'fill-opacity': o.fillStyle === 'solid' ? 1 : 0.35, stroke: o.stroke, 'stroke-width': o.sw || 1.2 }, g);
    }
  };
  // dashed arrow along a polyline with rounded corners and an open head at the end
  Pen.prototype.arrow = function (g, pts, o) {
    var d = 'M' + pts[0][0] + ' ' + pts[0][1], R = 7;
    for (var i = 1; i < pts.length; i++) {
      var p = pts[i];
      if (i < pts.length - 1) {
        var a = pts[i - 1], b = pts[i + 1];
        var l1 = Math.hypot(p[0] - a[0], p[1] - a[1]), l2 = Math.hypot(b[0] - p[0], b[1] - p[1]);
        var r = Math.min(R, l1 / 2, l2 / 2);
        var p1 = [p[0] - (p[0] - a[0]) / l1 * r, p[1] - (p[1] - a[1]) / l1 * r];
        var p2 = [p[0] + (b[0] - p[0]) / l2 * r, p[1] + (b[1] - p[1]) / l2 * r];
        d += ' L' + p1[0] + ' ' + p1[1] + ' Q' + p[0] + ' ' + p[1] + ' ' + p2[0] + ' ' + p2[1];
      } else d += ' L' + p[0] + ' ' + p[1];
    }
    if (this.rc) g.appendChild(this.rc.path(d, { seed: o.seed || 3, roughness: 0.8, bowing: 0.5, stroke: o.stroke, strokeWidth: 1.3, strokeLineDash: [6, 5] }));
    else el('path', { d: d, fill: 'none', stroke: o.stroke, 'stroke-width': 1.3, 'stroke-dasharray': '6 5' }, g);
    var q = pts[pts.length - 2], e = pts[pts.length - 1], ang = Math.atan2(e[1] - q[1], e[0] - q[0]), L = 10;
    [-0.42, 0.42].forEach(function (dd) {
      el('line', { x1: e[0], y1: e[1], x2: e[0] - L * Math.cos(ang + dd), y2: e[1] - L * Math.sin(ang + dd),
        stroke: o.stroke, 'stroke-width': 1.5, 'stroke-linecap': 'round' }, g);
    });
  };

  function palette(root, forExport) {
    var light = { fg: '#1e1e1e', muted: '#5c636a', bg: '#ffffff', blue: FILL_BLUE, green: FILL_GREEN, red: INK_RED,
      blueLine: '#1971c2', greenLine: '#2f9e44', appFill: FILL_GREEN };
    if (forExport) return light;
    var cs = getComputedStyle(root);
    function v(n, d) { var s = cs.getPropertyValue(n).trim(); return s || d; }
    var bg = v('--md-default-bg-color', '#ffffff');
    var dark = document.body.getAttribute('data-md-color-scheme') === 'slate';
    var fg = v('--md-default-fg-color', '#1e1e1e');
    return { fg: fg, muted: dark ? 'rgba(230, 237, 243, 0.78)' : '#5c636a', bg: bg,
      blue: dark ? '#2a4d6c' : FILL_BLUE, green: dark ? '#2a5c40' : FILL_GREEN, red: dark ? '#ff8787' : INK_RED,
      blueLine: dark ? '#4dabf7' : '#1971c2', greenLine: dark ? '#51cf66' : '#2f9e44', appFill: dark ? '#1d3b2a' : FILL_GREEN };
  }

  // ------------------------------------------------------------------ arrow routing
  function cross(a, b, c) { return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); }
  function onSeg(a, b, p) { return Math.min(a[0], b[0]) <= p[0] && p[0] <= Math.max(a[0], b[0]) && Math.min(a[1], b[1]) <= p[1] && p[1] <= Math.max(a[1], b[1]); }
  function segsMeet(a, b, c, d) {
    var d1 = cross(c, d, a), d2 = cross(c, d, b), d3 = cross(a, b, c), d4 = cross(a, b, d);
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
    // collinear pieces that overlap also count: lines lying on top of each other
    if (d1 === 0 && d2 === 0 && d3 === 0 && d4 === 0) return onSeg(a, b, c) || onSeg(a, b, d) || onSeg(c, d, a);
    return false;
  }
  function meets(p, q) {
    for (var i = 0; i < p.length - 1; i++) for (var j = 0; j < q.length - 1; j++) if (segsMeet(p[i], p[i + 1], q[j], q[j + 1])) return true;
    return false;
  }
  function perms(n) {
    if (n <= 1) return [[0].slice(0, n)];
    var out = [];
    perms(n - 1).forEach(function (p) { for (var i = 0; i <= p.length; i++) { var q = p.slice(); q.splice(i, 0, n - 1); out.push(q); } });
    return out;
  }
  /*
   * Arrows go from values (left) to spec lines (right). Each arrow that has to change height runs on its own
   * vertical lane in the gap between the two columns. Lanes are assigned so that no two arrows cross or lie on
   * top of each other; arrows into the same line end at slightly different heights.
   */
  function routeRight(items, x1, x2) {
    var byTarget = {};
    items.forEach(function (it) { (byTarget[it.target] = byTarget[it.target] || []).push(it); });
    Object.keys(byTarget).forEach(function (k) {
      var list = byTarget[k];
      list.forEach(function (it, i) { it.yt += (i - (list.length - 1) / 2) * 7; });
    });
    var bent = items.filter(function (it) { return Math.abs(it.ys - it.yt) >= 3; });
    var lanes = bent.map(function (_, j) { return x1 + (x2 - x1) * (j + 1) / (bent.length + 1); });
    function paths(assign) {
      return items.map(function (it) {
        var j = bent.indexOf(it);
        if (j < 0) return [[it.xs, it.ys], [it.xt, it.ys]];
        var L = lanes[assign[j]];
        return [[it.xs, it.ys], [L, it.ys], [L, it.yt], [it.xt, it.yt]];
      });
    }
    var best = null, bestN = Infinity;
    perms(bent.length).forEach(function (a) {
      var ps = paths(a), n = 0;
      for (var i = 0; i < ps.length; i++) for (var j = i + 1; j < ps.length; j++) if (meets(ps[i], ps[j])) n++;
      if (n < bestN) { bestN = n; best = ps; }
    });
    if (bestN > 0 && window.console) console.warn('runtime-sheet: ' + bestN + ' arrow crossing(s) left');
    return best;
  }

  // ------------------------------------------------------------------ layout and drawing
  var SZ = { title: 30, cname: 19, mode: 15, app: 17, val: 15, spec: 15, note: 14.5, head: 16, small: 13.5, server: 17 };
  var LH = { val: 23, spec: 21, note: 19.5 };

  /*
   * Draws the sheet for a state. Two layouts:
   *   full   - cpu/memory right of the app, notes in a column on the right, like the original sheets;
   *   narrow - everything stacked, small numbers instead of arrows (phones).
   */
  function draw(sheet, state, col, layout) {
    var wide = layout !== 'narrow';
    var svg = el('svg', { xmlns: NS, viewBox: '0 0 1000 1000', role: 'img', 'aria-label': sheet.title + ': что видит рантайм в вариантах деплоя' });
    var pen = new Pen(svg), root = el('g', {}, svg);
    HALO = /^#|^rgb/.test(col.bg) ? col.bg : null;
    var conts = sheet.containers(state), groups = [];

    // sizes come from the longest texts, so long flags never cross the frame
    var maxVal = 0, maxSpec = 0, maxApp = 0;
    conts.forEach(function (c) {
      c.values.forEach(function (v) { maxVal = Math.max(maxVal, width(v.t, SZ.val)); });
      c.spec.forEach(function (s) { maxSpec = Math.max(maxSpec, width(s.t, SZ.spec) + (s.head ? 0 : 20)); });
      maxApp = Math.max(maxApp, width(c.app, SZ.app));
    });
    var GAP = 48;
    var appWide = Math.max(200, maxVal + 32, maxApp + 26);
    var swWide = Math.max(460, 18 + 14 + appWide + GAP + maxSpec + 18 + 18);
    var NOTES_W = 300;
    var W = wide ? swWide + 16 + 24 + NOTES_W : 400;
    var sx = 8, sy = 64, sw = wide ? swWide : W - 16;
    var cx = sx + (wide ? 18 : 12), cw = sw - (wide ? 36 : 24);
    var appW = wide ? appWide : cw - 28;

    text(root, 12, 42, sheet.title, { fill: col.fg, size: SZ.title });
    var serverG = el('g', {}, root);
    var y = sy + 50, seed = 20, serverArrows = [];

    conts.forEach(function (c, ci) {
      var g = el('g', { 'class': 'rt-c', tabindex: 0, role: 'group', 'aria-label': c.name + ', ' + c.mode }, root);
      var body = el('g', {}, g);
      var arrowsG = el('g', { 'class': 'rt-arrows', style: '--i:' + ci }, g);
      groups.push(g);
      var cy = y, ay = cy + 46, ax = cx + 16;
      var vals = c.values.map(function (v, k) { return { v: v, x: ax + 16, y: ay + 58 + k * LH.val }; });
      var appH = 58 + c.values.length * LH.val - 4;
      var spX = wide ? ax + appW + GAP : ax + 14, spY = wide ? ay + 22 : ay + appH + 30;
      var specPos = {};
      c.spec.forEach(function (s, line) {
        s._x = spX + (s.head ? 0 : 20); s._y = spY + line * LH.spec;
        if (s.id) specPos[s.id] = s;
      });
      var specH = c.spec.length * LH.spec;
      var innerH = wide ? Math.max(appH, specH + 14) : appH + 30 + specH;
      var ch = innerH + 46 + 22;

      pen.box(body, cx, cy, cw, ch, { stroke: col.blueLine, fill: col.blue, seed: seed++ });
      text(body, cx + 16, cy + 30, c.name, { fill: col.fg, size: SZ.cname, halo: true });
      text(body, cx + 16 + width(c.name, SZ.cname) + 12, cy + 30, c.mode, { fill: col.muted, size: SZ.mode, halo: true });
      pen.box(body, ax, ay, appW, appH, { stroke: col.greenLine, fill: col.appFill, fillStyle: 'solid', seed: seed++ });
      text(body, ax + 14, ay + 28, c.app, { fill: col.fg, size: SZ.app });

      // value-to-spec pairs; traps (red) to the node
      var pairs = [], num = 0;
      vals.forEach(function (p) {
        if (!p.v.to) return;
        if (p.v.to === 'server') { serverArrows.push({ g: arrowsG, xs: p.x - 6, ys: p.y - 5 }); return; }
        var s = specPos[p.v.to];
        if (s) pairs.push({ p: p, s: s, n: ++num });
      });
      vals.forEach(function (p) {
        text(body, p.x, p.y, p.v.t, { fill: p.v.bad ? col.red : p.v.dim ? col.muted : col.fg, size: SZ.val });
      });
      c.spec.forEach(function (s) {
        text(body, s._x, s._y, s.t, { fill: s.head ? col.muted : col.fg, size: SZ.spec, halo: true });
      });

      if (wide && pairs.length) {
        var items = pairs.map(function (q) {
          return { xs: q.p.x + width(q.p.v.t, SZ.val) + 7, ys: q.p.y - 5, xt: q.s._x - 7, yt: q.s._y - 5, target: q.p.v.to, color: q.p.v.bad ? col.red : col.fg };
        });
        routeRight(items, ax + appW + 8, spX - 8).forEach(function (pts, i) { pen.arrow(arrowsG, pts, { stroke: items[i].color, seed: seed++ }); });
      } else if (!wide) {
        // phones: the same small number next to a value and its source instead of an arrow
        pairs.forEach(function (q) {
          [[q.p.x + width(q.p.v.t, SZ.val) + 12, q.p.y], [q.s._x + width(q.s.t, SZ.spec) + 12, q.s._y]].forEach(function (pt) {
            text(arrowsG, pt[0], pt[1], '(' + q.n + ')', { fill: col.muted, size: 13 });
          });
        });
      }
      y = cy + ch + 20;
    });

    var sh = y - sy + 4;
    pen.box(serverG, sx, sy, sw, sh, { stroke: col.fg, sw: 1.5, r: 16, seed: 7 });
    text(serverG, sx + 14, sy + 30, 'Server 128 CPU', { fill: col.fg, size: SZ.server, halo: true });
    // traps that take the CPU count from the node: red arrows up to "Server 128 CPU", each on its own lane.
    // The lowest value takes the outer lane, so the lines never cross.
    if (serverArrows.length) {
      if (wide) {
        serverArrows.slice().sort(function (a, b) { return b.ys - a.ys; }).forEach(function (a, i) {
          var L = sx + 7 + i * 6;
          pen.arrow(a.g, [[a.xs, a.ys], [L, a.ys], [L, sy + 38]], { stroke: col.red, seed: seed++ });
        });
      } else {
        serverArrows.forEach(function (a) { text(a.g, a.xs - 2, a.ys + 5, '*', { fill: col.red, size: 16, anchor: 'end' }); });
        text(serverG, sx + 14 + width('Server 128 CPU', SZ.server) + 6, sy + 30, '*', { fill: col.red, size: 16 });
      }
    }
    var bottom = sy + sh + 30;
    wrap(sheet.model, SZ.small, sw - 14).forEach(function (ln) { text(root, sx + 14, bottom, ln, { fill: col.muted, size: SZ.small }); bottom += 20; });

    // notes: a column on the right, next to the containers (full) or under the server (narrow)
    var nx = wide ? sx + sw + 24 : 12, nw = wide ? NOTES_W : W - 24, ny = wide ? sy + 24 : bottom + 20;
    (typeof sheet.notes === 'function' ? sheet.notes(state) : sheet.notes).forEach(function (n) {
      if (typeof n === 'object' && n.h) {
        ny += 12;
        wrap(n.h, SZ.head, nw).forEach(function (ln) { text(root, nx, ny, ln, { fill: col.fg, size: SZ.head }); ny += 23; });
        return;
      }
      var small = typeof n === 'object' && n.small;
      var s = small ? n.small : n;
      var size = small ? SZ.small : SZ.note;
      wrap(s, size, nw - (small ? 0 : 16)).forEach(function (ln, i) {
        if (!small && i === 0) text(root, nx, ny, '-', { fill: col.muted, size: size });
        text(root, nx + (small ? 0 : 16), ny, ln, { fill: small ? col.muted : col.fg, size: size });
        ny += LH.note;
      });
      ny += 3;
    });
    var H = Math.max(bottom, ny) + 14;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    return { svg: svg, groups: groups };
  }

  // ------------------------------------------------------------------ PNG
  // the font goes into the exported svg as data, otherwise the picture falls back to a system font
  var fontCss = null;
  function embeddedFontCss() {
    if (fontCss) return fontCss;
    fontCss = Promise.all(FONT_FILES.map(function (f) {
      return fetch(FONT_BASE + f.file).then(function (r) { return r.blob(); }).then(function (b) {
        return new Promise(function (res) {
          var fr = new FileReader();
          fr.onload = function () { res('@font-face{font-family:Excalifont;src:url(' + fr.result + ') format("woff2");unicode-range:' + f.range + ';}'); };
          fr.readAsDataURL(b);
        });
      });
    })).then(function (parts) { return parts.join(''); }).catch(function () { return ''; });
    return fontCss;
  }
  function savePng(svg, bg, name) {
    embeddedFontCss().then(function (css) {
      if (css) { var st = el('style', {}); st.textContent = css; svg.insertBefore(st, svg.firstChild); }
      var w = +svg.getAttribute('width'), h = +svg.getAttribute('height'), pad = 24, scale = 2;
      var img = new Image();
      img.onload = function () {
        var c = document.createElement('canvas');
        c.width = (w + 2 * pad) * scale; c.height = (h + 2 * pad) * scale;
        var ctx = c.getContext('2d');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, pad * scale, pad * scale, w * scale, h * scale);
        c.toBlob(function (blob) {
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob); a.download = name;
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
        }, 'image/png');
      };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
    });
  }

  // ------------------------------------------------------------------ mount
  var uid = 0;
  function radio(parent, t, onChange) {
    var box = document.createElement('div'); box.className = 'rt-sheet__radio'; box.setAttribute('role', 'radiogroup'); box.setAttribute('aria-label', t.label);
    var name = 'rt' + (++uid);
    t.options.forEach(function (o) {
      var lab = document.createElement('label');
      var inp = document.createElement('input'); inp.type = 'radio'; inp.name = name; inp.value = o[0]; inp.checked = o[0] === t.value;
      inp.addEventListener('change', function () { if (inp.checked) onChange(o[0]); });
      lab.appendChild(inp); lab.appendChild(document.createTextNode(o[1]));
      box.appendChild(lab);
    });
    parent.appendChild(box);
  }

  function hover(host, groups) {
    groups.forEach(function (g) {
      function on() { host.classList.add('rt-focus'); groups.forEach(function (o) { o.classList.toggle('is-on', o === g); }); }
      function off() { host.classList.remove('rt-focus'); g.classList.remove('is-on'); }
      g.addEventListener('pointerenter', on); g.addEventListener('pointerleave', off);
      g.addEventListener('focus', on); g.addEventListener('blur', off);
    });
  }

  // full size view of the sheet on top of the page; Esc, the close button or a click outside closes it
  function openFull(sheet, state, root) {
    var ov = document.createElement('div'); ov.className = 'rt-overlay'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', sheet.title);
    var inner = document.createElement('div'); inner.className = 'rt-overlay__inner';
    var close = document.createElement('button'); close.type = 'button'; close.className = 'rt-overlay__close'; close.textContent = 'закрыть';
    var host = document.createElement('div'); host.className = 'rt-sheet__chart rt-in';
    inner.appendChild(close); inner.appendChild(host); ov.appendChild(inner); document.body.appendChild(ov);
    var d = draw(sheet, state, palette(root, false), 'full');
    host.appendChild(d.svg); hover(host, d.groups);
    function done() { ov.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') done(); }
    close.addEventListener('click', done);
    ov.addEventListener('click', function (e) { if (e.target === ov) done(); });
    document.addEventListener('keydown', onKey);
    close.focus();
  }

  function mount(root) {
    var id = root.getAttribute('data-sheet'), sheet = SHEETS[id];
    if (!sheet || root.__sheet) return;
    root.__sheet = true;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var state = {};
    sheet.toggles.forEach(function (t) { state[t.key] = t.value; });
    var ns = root.querySelector('noscript'); if (ns) ns.remove();
    var ctl = document.createElement('div'); ctl.className = 'rt-sheet__controls';
    var host = document.createElement('div'); host.className = 'rt-sheet__chart';
    root.appendChild(ctl); root.appendChild(host);
    var lastLayout = '', seen = reduced;
    function pick() { return host.clientWidth >= 520 ? 'full' : 'narrow'; }

    function render() {
      host.innerHTML = '';
      lastLayout = pick();
      var d = draw(sheet, state, palette(root, false), lastLayout);
      d.svg.removeAttribute('width'); d.svg.removeAttribute('height');
      host.appendChild(d.svg);
      if (seen) host.classList.add('rt-in');
      hover(host, d.groups);
    }
    sheet.toggles.forEach(function (t) { radio(ctl, t, function (v) { state[t.key] = v; render(); }); });
    var big = document.createElement('button'); big.type = 'button'; big.className = 'rt-sheet__save'; big.textContent = 'развернуть';
    big.addEventListener('click', function () { openFull(sheet, state, root); });
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'rt-sheet__save rt-sheet__png'; btn.textContent = 'PNG';
    btn.setAttribute('aria-label', 'Сохранить шпаргалку как PNG');
    btn.addEventListener('click', function () {
      var col = palette(root, true);
      var parts = [id].concat(sheet.toggles.map(function (t) { return t.key + state[t.key]; }));
      savePng(draw(sheet, state, col, 'full').svg, col.bg, parts.join('-') + '.png');
    });
    ctl.appendChild(big); ctl.appendChild(btn);
    render();
    // arrows appear container by container the first time the sheet is on screen
    if (!seen && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { seen = true; host.classList.add('rt-in'); io.disconnect(); } });
      }, { threshold: 0.15 });
      io.observe(root);
    } else { seen = true; host.classList.add('rt-in'); }
    window.addEventListener('resize', function () { if (pick() !== lastLayout) render(); });
    if (window.MutationObserver) new MutationObserver(render).observe(document.body, { attributes: true, attributeFilter: ['data-md-color-scheme'] });
  }

  function start() {
    loadFonts().then(function () { Array.prototype.forEach.call(document.querySelectorAll('.rt-sheet[data-sheet]'), mount); });
  }
  var ROUGH_URL = 'https://cdn.jsdelivr.net/npm/roughjs@4.6.6/bundled/rough.js';
  function boot() {
    if (!document.querySelector('.rt-sheet[data-sheet]')) return;
    if (window.rough) { start(); return; }
    var s = document.createElement('script'); s.src = ROUGH_URL; s.onload = start; s.onerror = start;
    document.head.appendChild(s);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
