import re
import os
import requests
import datetime
import shutil
import utils_pymssql_helper as u_db


conn = u_db.GetConnection(u_db.DB_MAIN)[0]

EMAIL_ADDRESS = "email_address"
BLOCKED = "blocked"
SOFT = "soft"
EMAIL_REGEX = re.compile(r"[^@]+@[^@]+\.[^@]+")
BLACK_REASON = 'black listed'
WHITE_REASON = 'soft bounce white listed'
BLACK_LIST_TBL = 'black_list'
WHITE_LIST_TBL = 'white_list'
UN_PARSED_FILE = 'Unparsed1'
REJECTED_FILE = 'Rejected'
NO_REPLY_FILE = 'r"E:\Program Files (x86)\Mail Enable\POSTOFFICES\mysodexo.co.il\MAILROOT\noreply"'
REJECTED_REASON = 'invalid mail'


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
        "over quota",
        "451 Temporary recipient"
    ]
    return any(k in line for k in keywords)


def check_email_addr_via_api(email):
    response = requests.get(
        "https://isitarealemail.com/api/email/validate",
        params={'email': email})
    status = response.json()["status"]
    return status == "valid"


def is_email_address_valid(email):
    return EMAIL_REGEX.match(email) is not None and check_email_addr_via_api(email)


def update_no_reply_tbl(collected_data, file_path, reason, description=None):
    try:
        cr = conn.cursor()
        cr.execute("insert into db_logs.dbo.noreply_inbox(send_time, recipient, reason, description, file)"
                   " values (eatng.dbo.f_sectoidt(?),?,?,?,?)", (datetime.datetime.now(), collected_data[EMAIL_ADDRESS], reason, description, file_path))
    finally:
        cr.close()


def is_in_db_tables(table_name, email):
    try:
        cr = conn.cursor()
        exists = cr.execute(("select 'x' from ? where email = ? )", (table_name, email)))
        return exists is not None
    finally:
        cr.close()


def parse_message(file_path, rejected_files_dir):
    regex = re.compile(r'[\w\.-]+@[\w\.-]+')
    collected_data = {}

    with open(file_path, "r") as f:
        for line in f:
            if collected_data.get(EMAIL_ADDRESS) is None:
                _emails = regex.findall(line)
                if _emails:
                    for _email in set(regex.findall(line)):
                        if "noreply" not in _email and "mailcontrol" not in _email:
                            if is_in_db_tables(BLACK_LIST_TBL, _email):
                                update_no_reply_tbl(collected_data, file_path, BLACK_REASON)
                                return
                            elif is_in_db_tables(WHITE_LIST_TBL, _email):
                                update_no_reply_tbl(collected_data, file_path, WHITE_REASON)
                                return
                            collected_data[EMAIL_ADDRESS] = _email

            if collected_data.get(BLOCKED) is None:
                if detected_reject_keywords(line):
                    collected_data[BLOCKED] = line
                    break
            if collected_data.get(SOFT) is None:
                if detected_soft_keywords(line):
                    collected_data[SOFT] = line
                    break

    if collected_data.get(EMAIL_ADDRESS) is not None:
        shutil.move(file_path, rejected_files_dir)
        if collected_data.get(BLOCKED) is not None:
            update_no_reply_tbl(collected_data, file_path, BLACK_REASON, collected_data.get(BLOCKED))
        else:
            description = "unknown reason was identified"
            if collected_data.get(SOFT) is not None:
                description = collected_data.get(SOFT)
            elif not is_email_address_valid(collected_data.get(EMAIL_ADDRESS)):
                description = "email address identified as invalid!"
            update_no_reply_tbl(collected_data, file_path, WHITE_REASON, description)


def un_parsed_dir():
    return os.path.join(NO_REPLY_FILE, UN_PARSED_FILE)


def rejected_dir():
    return os.path.join(NO_REPLY_FILE, REJECTED_FILE)


def main():
    rejected_file = rejected_dir()

    for f in os.listdir(un_parsed_dir()):
        try:
            parse_message(f, rejected_file)
        except Exception:
            pass