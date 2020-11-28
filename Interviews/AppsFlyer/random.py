"""
https://run.mocky.io/v3/e7e76bc6-c657-4896-a133-64391a7ff27e
From David Mark to Me: (Privately) (5:14 PM)
1. Get the data from the endpoint, and make sure to use today’s playlist.
2. Shuffle today's songs and make sure to:
* Do not repeat the same song twice before the song list ends.
* Play it endlessly and continue to respect the first rule.
3. Don't use the `random` function :
"""

from typing import List
import requests
import datetime
import time


def get_todays_list(data: dict) -> List[str]:
    today = datetime.date.today()
    return data.get(today.strftime("%Y%m%d"), -1)


def random(l: int):
    now = datetime.datetime.now()
    return int(now.microsecond % l)


def shuffle(l: List[str]) -> List[str]:
    random.randint(0, len(l)-1)


def play(l: List[str]):
    for i in l:
        print(f"i am currently playing {i}")
        time.sleep(5)


if __name__ == "__main__":
    url = "https://run.mocky.io/v3/e7e76bc6-c657-4896-a133-64391a7ff27e"
    data = requests.get(url)
    # print(get_todays_list(data.json()))
    print(random(10))