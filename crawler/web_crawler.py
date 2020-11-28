import os
import requests
import re

from urllib.parse import urlparse
from typing import List, Set


class PyCrawler:
    def __init__(self, starting_url: str):
        self.starting_url = starting_url
        self.visited = set()
        self.__regex = re.compile('''<a\s+(?:[^>]*?\s+)?href="([^"]*)"''')
        self.__meta_regex = re.compile("<meta .*?name=[\"'](.*?)['\"].*?content=[\"'](.*?)['\"].*?>")
        # self.proxy_orbit_key = os.getenv("PROXY_ORBIT_TOKEN")
        self.user_agent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36"
        # self.proxy_orbit_url = f"https://api.proxyorbit.com/v1/?token={self.proxy_orbit_key}&ssl=true&rtt=0.3&protocols=http&lastChecked=30"

    def get_urls(self, url: str) -> Set[str]:
        html = self.get_html(url)
        parsed = urlparse(url)
        base = f"{parsed.scheme}://{parsed.netloc}"
        links = self.__regex.findall(html)
        for i, link in enumerate(links):
            if not urlparse(link).netloc:
                links[i] = base + link
        return set([l for l in links if 'mailto' not in l])

    def get_html(self, url: str):
        try:
            # proxy_info = requests.get(self.proxy_orbit_url).json()
            # proxy = proxy_info['curl']
            # html = requests.get(url, headers={"User-Agent":self.user_agent}, proxies={"http":proxy, "https":proxy}, timeout=5)
            html = requests.get(url, headers={"User-Agent": self.user_agent})
        except Exception as e:
            print(f"Failed to get html from {url}, error: {e}")
            return ""
        return html.content.decode("latin-1")

    def extract_info(self, url: str):
        html = self.get_html(url)
        meta = self.__meta_regex.findall(html)
        return dict(meta)

    def crawl(self, url: str):
        for link in self.get_urls(url):
            if link in self.visited:
                continue
            self.visited.add(link)
            info = self.extract_info(link)
            print(f"""Link: {link}    
Description: {info.get('description')}    
Keywords: {info.get('keywords')}    
            """)
            self.crawl(link)

    def start(self):
        self.crawl(self.starting_url)


if __name__ == "__main__":
    c = PyCrawler("http://geeksforgeeks.com")
    c.start()
