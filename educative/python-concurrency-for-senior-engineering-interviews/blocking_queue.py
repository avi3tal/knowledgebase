from threading import Condition


class BlockingQueue:
    def __init__(self, max_size: int):
        self.__cond = Condition()
        self.__q = []
        self.__max_size = max_size
        self.__curr_size = 0

    def enqueue(self, item):
        self.__cond.acquire()
        while self.__curr_size == self.__max_size:
            self.__cond.wait()

        self.__q.append(item)
        self.__curr_size += 1
        self.__cond.notifyAll()
        self.__cond.release()

    def dequeue(self):
        self.__cond.acquire()
        if not self.__curr_size:
            self.__cond.wait()
        item = self.__q.pop(0)
        self.__curr_size -= 1
        self.__cond.notifyAll()
        self.__cond.release()
        return item
