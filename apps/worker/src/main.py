import time

from src.jobs.ping import ping


def main() -> None:
    print("Worker scaffold booting...")
    print(ping())
    while True:
        time.sleep(60)


if __name__ == "__main__":
    main()
