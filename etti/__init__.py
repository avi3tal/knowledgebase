import concurrent.futures
import threading


def _get_mails_from_db():
	"""get top 20 mails"""
	pass


def done(fn):
	if fn.cancelled():
		fn.arg.failed()
	elif fn.done():
		error = fn.exception()
		if error:
			fn.arg.failed()
		else:
			# result = fn.result()
			fn.arg.done()


class Dispatcher(threading.Thread):
	def __init__(self):
		super().__init__()
		self.stopping = threading.Event()
		self.tasks = []

	def run(self):
		with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
			# change while to to something base on interval
			while self.stopping.is_set():
				mails = _get_mails_from_db()
				future = executor.submit(worker, mails)
				state_handler = StateHandler(db_conn=conn, [m.id for mail in mails])
				state_handler.in_progress()
				future.arg = state_handler
				future.add_done_callback(done)


def worker(mails):
	for m in mails:
		...


class StateHandler:
	def __init__(self, db_conn, mail_ids):
		pass

	def in_progress(self):
		pass

	def done(self):
		pass

	def failed(self):
		pass