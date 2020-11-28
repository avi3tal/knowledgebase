import concurrent.futures


class Corpus:
    def __init__(self, documents):
        self.__corpus = self.__load_corpus(documents)

    def __load_corpus(self, D):
        output = {}
        with concurrent.futures.ThreadPoolExecutor(max_workers=len(D)) as executor:
            for future in executor.map(Corpus.file_parser, D):
                output.update(future)
        return output

    @staticmethod
    def file_parser(d):
        cache = {}
        with open(d, "r") as f:
            for l in f:
                for w in l\
                        .replace(',', "")\
                        .replace('.', "")\
                        .replace(':', "")\
                        .replace(';', "")\
                        .replace('-', "")\
                        .replace("?", "") \
                        .replace("\"", "") \
                        .rstrip("\n").split(" "):
                    if w in cache:
                        cache[w] += 1
                    else:
                        cache[w] = 1
        return {d: cache}

    @property
    def corpus(self):
        return self.__corpus

    def tf(self, t, d):
        ...

    def idf(self, t, D):
        ...


c = Corpus(["example1.txt", "example2.txt"])
print(c.corpus)
