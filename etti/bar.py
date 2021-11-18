import re
import requests

EMAIL_ADDRESS = "email_address"
BLOCKED = "blocked"
SOFT = "soft"
EMAIL_REGEX = re.compile(r"[^@]+@[^@]+\.[^@]+")


def detected_reject_keywords(line):
	keywords = [
		"5.1.1",
		"invalid",
		"does not appear to exists",
		"does not exist",
		"User Unknown",
		"unknown or illegal alias",
		"does not have any DNS records"
	]
	return any(k in line for k in keywords)


def detected_soft_keywords(line):
	keywords = [
		"",
	]
	return any(k in line for k in keywords)


def _check_email_addr_via_api(email):
	response = requests.get(
		"https://isitarealemail.com/api/email/validate",
		params={'email': email})
	status = response.json()["status"]
	return status == "valid"


def is_email_address_valid(email):
	return EMAIL_REGEX.match(email) is not None and _check_email_addr_via_api(email)


def move_file_to_rejected_dir(file_path):
	...


def update_db(collected_data, file_path):
	...



def parse_message(file_path):
	regex = re.compile(r'[\w\.-]+@[\w\.-]+')
	collected_data = {}

	with open(file_path, "r") as f:
		for line in f:
			if collected_data.get(EMAIL_ADDRESS) is None:
				_emails = regex.findall(line)
				if _emails:
					for _email in set(regex.findall(line)):
						if "noreply" not in _email and "mailcontrol" not in _email:
							collected_data[EMAIL_ADDRESS] = _email
			if collected_data.get(BLOCKED) is None:
				if detected_reject_keywords(line):
					collected_data[BLOCKED] = line

			if collected_data.get(SOFT) is None:
				if detected_soft_keywords(line):
					collected_data[SOFT] = line

			if collected_data.get(EMAIL_ADDRESS) is not None and \
					(collected_data.get(BLOCKED) is not None or collected_data.get(SOFT) is not None):
				break

	email_address = collected_data.get(EMAIL_ADDRESS)
	if email_address is not None:
		if not is_email_address_valid(email_address) or collected_data.get(BLOCKED) is not None:
			new_file_path = move_file_to_rejected_dir(file_path)
			update_db(collected_data, new_file_path)


