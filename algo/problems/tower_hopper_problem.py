"""
Well describe in https://www.youtube.com/watch?v=kHWy5nEfRIQ
"""
from algo import dynamic_programming


class NativeSolution(object):
    @staticmethod
    def next_step(current, towers):
        """
        The following algorithm will try to identify the next best step
        :param current:
        :param towers:
        :return:
        """
        # print(">>>> {}->{} of {}".format(current, towers[current], towers))

        # check if the next jump already capable for passing the entire list
        if current + towers[current] >= len(towers):
            return current + towers[current]

        # create a new sub list from the current -> farest jump by current value
        sub = towers[current + 1: current + towers[current] + 1]
        # create new list calculating each entity with the position and value
        options = []
        for i, v in enumerate(sub):
            if v == 0:
                options.append(v)
            else:
                options.append(v + i)

        # if new list is not empty calculate the new current by adding the max value position to the current position
        if options:
            sub_next = options.index(max(options))
            current += sub_next + 1

        # print("sub {} options {} best {}".format(sub, options, current))
        return current


    @staticmethod
    def is_hopable(towers):
        """
        Check if a given seq can be hap till user in position 0 will be able to jump outside the seq
        :param towers: list of integers describes set of towers
        :return: Boolean
        """

        # assumptions: List can't be empty or start with zero
        if len(towers) == 0 or towers[0] == 0:
            return False

        print("Testing {}".format(towers))
        current = 0
        count = 0
        while True:
            if current >= len(towers):
                print("hopping with {} numbers of jumps".format(count))
                return True
            if towers[current] == 0:
                return False
            count += 1
            current = NativeSolution.next_step(current, towers)


class GraphDFSSolution(object):
    """
    Graph approach (https://www.youtube.com/watch?v=zaBhtODEL0w)
    DFS (Depth First Search)
    it dive deep into each root tree and ask hasPath(s, t)
    The major disadvantage is that we might end up diving into one root when we have the node we are looking
    for right at the second root
    Implementation: simple recursive alorithem passing "is_visited" flag to avoid infinit loop
    """
    @staticmethod
    def is_hopable(towers):
        pass


class GraphBFSSolution(object):
    """
    BFS Breadth First Search
    Go wider before we go deep and that we do by asking fist child if onw of his direct children is
    the node we are looking for.
    Implementation: using "queue" once asking all the direct children, we add them to the queue
    """
    @staticmethod
    def is_hopable(towers):
        pass


class DynamicProgrammingSolution(object):
    """
    The classic question is "minimum numbers of jumps to get the end ...
    could be found in https://www.geeksforgeeks.org/minimum-number-of-jumps-to-reach-end-of-a-given-array/
    We added small change to make it serve our purpose

    Time Complexity: O(n^2)
    """
    @staticmethod
    @dynamic_programming
    def is_hopable(towers):
        # converting classic "min jumps to index..." algorithm into our is_happable requirements
        towers.append(0)
        n = len(towers)
        jumps = [0 for _ in range(n)]

        if (n == 0) or (towers[0] == 0):
            return float('inf')

        jumps[0] = 0

        for i in range(1, n):
            jumps[i] = float('inf')
            for j in range(i):
                if (i <= j + towers[j]) and (jumps[j] != float('inf')):
                    jumps[i] = min(jumps[i], jumps[j] + 1)
                    break

        if jumps[n-1] != float('inf'):
            print("hopping with {} numbers of jumps".format(jumps[n-1]))
            return True
        else:
            return False


if __name__ == "__main__":
    # seq = [4, 2, 0, 0, 2, 0]
    # seq = [1, 0]
    # seq = [4, 2, 0, 0, 2, 0, 7, 0, 3, 1, 0]
    # seq = [4, 2, 0, 0, 2, 0, 2, 0, 3, 1, 0]
    # seq = [4, 2, 0, 0, 2, 0, 2, 0, 1, 1, 0]
    # seq = [4, 2, 0, 0, 1, 0]
    seq = [1, 3, 6, 1, 0, 9]

    print(NativeSolution.is_hopable(seq))
    print(DynamicProgrammingSolution.is_hopable(seq))
