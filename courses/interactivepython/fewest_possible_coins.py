

def fewest_possible_coins(coins_value_list, change, cache):
    min_coins = change
    if change in coins_value_list:
        cache[change] = 1
        return 1
    elif cache[change] > 0:
        return cache[change]
    else:
        for coin in [c for c in coins_value_list if c <= change]:
            num_coins = 1 + fewest_possible_coins(coins_value_list, change - coin, cache)
            if num_coins < min_coins:
                min_coins = num_coins
                cache[change] = min_coins

    return min_coins


if __name__ == "__main__":
    empty_cache = [0]*101
    print(fewest_possible_coins([1, 5, 10, 25], 100, empty_cache))
    print(empty_cache)
