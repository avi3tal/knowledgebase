import os, traceback, shutil, base64, time, json, dateutil.parser  # , odbc
import trace_helper
import utils_os_helper as u_os
import utils_post_helper as u_post
import utils_pymssql_helper as u_db
import re

conn = u_db.GetConnection(u_db.DB_MAIN)[0]


def main():
	for f in os.listdir(unparsed_dir("")):
		try:
			f_ = deleted_dir(f)
			__f = unparsed_dir(f)
			print
			__f
			# parse message
			d = {"f": f}
			# d = parse_message(_f, d)
			if d:
				d = parse_message2(__f, d)
			print
			d

		# send it to dd
		# dd(d)
		# insert hard bounces to sql table
		# db(d)

		# move it to deleted
		# shutil.move(_f, f_)
		# break
		except:
			# shutil.move(_f, __f)
			print
			f
			print
			traceback.format_exc()
		# break


def db(d):
	try:
		cr = conn.cursor()
		cr.execute(
			"insert into db_logs.dbo.noreply_inbox(send_time, recipient, reason, subject) values (eatng.dbo.f_sectoidt(?),?,?,?)",
			(d["ReceivedTs"], d["Recipient"], d["Reason"], d["SubjectDecoded"])
			)
	except:
		print
		traceback.format_exc()
		pass
	finally:
		try:
			cr.close()
		except:
			pass


def dd(d):
	# print d
	ts = d["ReceivedTs"]

	ddt = trace_helper.Trace()
	dds = trace_helper.Span(ddt.id, "parse", "noreply_inbox", "mailgw", trace_helper.Span.Type.WEB)
	dds.start = int(ts * 1000000000)
	dds.duration = 1000000000  # 1 sec dummy value
	ddt.add_span(dds)
	dds.add_meta_dict(d)
	dds.error = 1
	# print json.dumps([ddt.to_list()])
	# print d
	# print dds.__dict__
	print
	u_post.PostRequestEx(data=[ddt.to_list()], server=trace_helper.TRACE_SERVER, url=trace_helper.TRACE_PATH,
						 headers=trace_helper.HEADERS, verb="PUT")


def parse_message2(file, res):
	result = {}
	regex = re.compile(r'[\w\.-]+@[\w\.-]+')
	regex1 = re.compile(r'\w\reason:\w\+', re.IGNORECASE)
	regex2 = re.compile(r'subject:\s+', re.IGNORECASE)
	# date_field = re.search(r"Date:.*", item)
	regex3 = re.compile(r'\b\d{4}[-/]\d{2}[-/]\d{2}\s\d{2}:\d{2}:\d{2}\s[-+]\d{4}\b')
	with open(file, "r") as f:
		for l in f:
			for _email in set(regex.findall(l)):
				if not "noreply" in _email and not "mailcontrol" in _email:
					result['email'] = _email
		# send_time = regex3.findall(l)
		# result['send_time'] = send_time
		# _reason = regex1.search(l)
		# if _reason:
		# result['reason'] = _reason.group()
		# else:
		# result['reason'] = 'cant find it'
		return result


def parse_message(file, res):
	b_pre_header = True
	b_reason_value = False
	try:
		with open(file, "rt") as a_file:
			for l in a_file:
				# print l
				if b_pre_header:
					if "The following recipient" not in l:
						continue
					b_pre_header = False
					continue
				# print b_reason_value, l
				if b_reason_value:
					if "Message contents follow" in l or "Message headers follow" in l:
						b_reason_value = False
						res[k.strip()] = v.strip()
						continue
					if len(l) == 0:
						continue
					v += l
					continue
				if ":" not in l:
					continue
				line_list = l.split(":")
				# print line_list
				if len(line_list) < 2:
					continue
				k, v = line_list[0].strip(), (":".join(line_list[1:])).strip()
				if k == "Reason":
					b_reason_value = True
					continue
				elif k == "Recipient":
					v = v.replace("[SMTP:", "").replace("]", "")
				elif k == "Subject":
					prefix, encoding = None, None
					if subject_utf8 in v:
						prefix, encoding = subject_utf8, "utf-8"
					elif subject_cp1255 in v:
						prefix, encoding = subject_cp1255, "cp1255"
					else:
						res["SubjectDecoded"] = v
					if prefix and encoding:
						res["SubjectDecoded"] = base64.b64decode(v.replace(prefix, "")).decode(encoding)
				elif k == "Received":
					date_str = v.split(";")[-1]
					received_dt = dateutil.parser.parse(date_str)
					ts = time.mktime(received_dt.timetuple())
					res["ReceivedTs"] = ts
				# print k,v
				res[k.strip()] = v.strip()
	except Exception as err:
		logging.warning(err)
		return []
	return res


def base_dir(f):
	return os.path.join(r"E:\Program Files (x86)\Mail Enable\POSTOFFICES\mysodexo.co.il\MAILROOT\noreply", f)


def unparsed_dir(f):
	return os.path.join(base_dir("Unparsed1"), f)


def deleted_dir(f):
	return os.path.join(base_dir("Deleted Items"), f)


subject_utf8 = "=?utf-8?b?"
subject_cp1255 = "=?cp1255?b?"
main()